import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import * as jwt from 'jwt-decode';
import { gql } from '@apollo/client';
import { useQuery as useApolloQuery } from '@apollo/client/react';
import { AppSidebar } from './app-sidebar';
import type { UserData } from '@/context/user-context';
import { UserContext } from '@/context/user-context';

interface JwtPayload {
  user_hash: string;
  username: string;
  account_type: string;
  roles: string[];
  exp: number;
}

// Manual type for the query result (matches your GraphQL structure)
interface GetOrgCohortsByIdQuery {
  org_cohorts?: {
    fetch_data_by_filters_orgcohorts?: {
      org_cohorts?: Array<{
        is_root: boolean;
        is_general: boolean;
      }>;
    };
  };
}

function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  try {
    const decoded = jwt.jwtDecode<JwtPayload>(token);
    return decoded.exp ? Date.now() < decoded.exp * 1000 : false;
  } catch {
    return false;
  }
}

const GET_ORG_COHORTS_BY_ID = gql`
  query GetOrgCohortsById($id: Int!) {
    org_cohorts {
      fetch_data_by_filters_orgcohorts(input_json: { id: $id }) {
        org_cohorts {
          is_root
          is_general
        }
      }
    }
  }
`;

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCheckingToken, setIsCheckingToken] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!isTokenValid(token)) {
      navigate('/login', { replace: true });
    } else {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      setUser(storedUser);
      setIsCheckingToken(false);
    }
  }, [navigate]);

  const { data: cohortData, loading } = useApolloQuery<GetOrgCohortsByIdQuery>(
    GET_ORG_COHORTS_BY_ID,
    {
      variables: { id: Number(user?.cohort_id) },
      skip: !user?.cohort_id,
    }
  );

  useEffect(() => {
    if (cohortData && user) {
      const orgData =
        cohortData.org_cohorts?.fetch_data_by_filters_orgcohorts
          ?.org_cohorts?.[0];
      if (orgData) {
        const updatedUser: UserData = {
          ...user,
          is_root: orgData.is_root,
          is_general: orgData.is_general,
        };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    }
  }, [cohortData, user]);

  if (isCheckingToken || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background" />
    );
  }

  const isLoginPage = location.pathname === '/login';

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <div
        className={`flex h-screen text-foreground ${
          isLoginPage ? '' : 'bg-background'
        }`}
        style={
          isLoginPage
            ? {
                backgroundImage: `url(/login_background.png)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }
            : undefined
        }
      >
        {!isLoginPage && <AppSidebar />}
        <main className="flex-1 overflow-y-auto bg-background">
          <Outlet />
        </main>
      </div>
    </UserContext.Provider>
  );
};

export default Layout;
