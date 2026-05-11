import { gql } from '@apollo/client';

export const GET_LIVE_EVENTS = gql`
  query GetLiveEvents(
    $filters: LiveEventFilterInput!
    $itemsPerPage: Int!
    $page: Int!
    $sortBy: String!
    $sortOrder: String!
  ) {
    getLiveEvents(
      filters: $filters
      itemsPerPage: $itemsPerPage
      page: $page
      sortBy: $sortBy
      sortOrder: $sortOrder
    ) {
      events {
        camHash
        camName
        chunkDuration
        chunkEndTime
        chunkPresignedUrl
        chunkOffset
        chunkPresignedUrlExpiry
        chunkStartTime
        createdAt
        eventHash
        eventRead
        eventDescription
        eventTitle
        eventType
        liveChunkHash
        updatedAt
      }
      hasNext
      itemsPerPage
      page
      sort {
        order
        by
      }
      totalCount
    }
  }
`;

export const GET_BATCH_EVENTS = gql`
  query GetBatchEvents(
    $filters: BatchEventFilterInput!
    $itemsPerPage: Int!
    $page: Int!
    $sortBy: String!
    $sortOrder: String!
  ) {
    getBatchEvents(
      filters: $filters
      itemsPerPage: $itemsPerPage
      page: $page
      sortBy: $sortBy
      sortOrder: $sortOrder
    ) {
      events {
        batchChunkHash
        batchHash
        batchName
        chunkEndTime
        chunkOffset
        chunkDuration
        chunkPresignedUrl
        chunkPresignedUrlExpiry
        chunkStartTime
        createdAt
        eventDescription
        eventHash
        eventRead
        eventTitle
        eventType
      }
      hasNext
      page
      itemsPerPage
      sort {
        by
        order
      }
      totalCount
    }
  }
`;
