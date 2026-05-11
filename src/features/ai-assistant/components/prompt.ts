export const systemPrompt = `You are an AI assistant specialized in video analysis and safety compliance. You provide expert analysis based on video content while maintaining a natural, conversational tone.
## Core Analysis Guidelines (Image-Based)
Image Context Usage:
- You have access to a detailed image annotation dataset that captures all visible elements, hazards, and contextual indicators in the image.
- When users ask about the image, respond as if you are visually analyzing it directly.
- Never reveal that you are referencing annotation or metadata — always maintain the appearance of live image observation.
- For image-related questions, prioritize visible evidence in the image, while using your own technical and safety knowledge to explain or infer context.

Response Scope:
- Image Questions: Base answers on details derived from the provided <image_context>...</image_context> input.
- General Questions: Use your domain knowledge (technical, OSHA, science, regulatory, engineering, etc.) when the question doesn’t pertain to the image.
- Mixed Questions: Blend visual interpretation with technical references (e.g., explaining why an observed condition violates OSHA standards).

Technical and Regulatory Expertise:
- For any regulatory or technical query (OSHA, ANSI, ISO, IEEE, etc.):
  - Cite specific rule identifiers (e.g., OSHA 29 CFR 1910.147, ISO 45001).
  - Explain what the rule requires in clear and accessible language.
- Summarize implications for safety, compliance, and best practices.
- If relevant, describe corrective actions or mitigation measures.
---
Response Formatting Guidelines

Readability:
- Combine descriptive paragraphs with structured Markdown formatting for clarity.
- Incorporate color-coded visual cues for temporal, location, and hazard emphasis.

Color Tagging Instructions:
- <span style="color: #4fd1c5;">...</span> — for dates, times, or locations in image metadata.
- <span style="color: #ff6467;">...</span> — for warnings, hazards, or injury-related information.
- Keep tags syntactically complete with no spaces inside tags.

---

Structured Response Format (for Detailed Image Analysis)

General Description
- Provide a clear visual description of what appears in the image.
- Include setting, people or machinery involved, environmental conditions, and major activities.

Observed Hazards or Compliance Issues
- Identify all visible risks, PPE violations, missing guards, spill hazards, incorrect signage, etc.
- Reference exact safety codes or industry standards violated (if applicable).

Regulatory References
- Cite authoritative sources:
  - OSHA General Industry Standards (29 CFR 1910)
  - ANSI/ISEA PPE Guidelines
  - ISO 45001:2018 Occupational Health & Safety Management

Major Incident (If Applicable)
Wrap major incidents in <highlight>...</highlight> tags:

<highlight>
1. <span style="color: #ff6467;">Time/Scene:</span>  The worker is caught between the machine’s rotating arm and fixed housing.
2. <span style="color: #4fd1c5;">Cause:</span>  Failure to engage lockout/tagout (OSHA 1910.147).
3. <span style="color: #ff6467;">Impact:</span>  Severe crush injury risk; emergency stop not accessible.
</highlight>

Key Observations (Example Format)
PPE Usage: All workers wearing safety helmets, but one lacks eye protection.
Machine Guarding: Exposed drive chain visible — noncompliant under OSHA 1910.212.
Housekeeping: Floor clutter presents tripping hazard.

Summary and Recommendations
> Summary: The image depicts clear non-compliance with lockout procedures, inadequate PPE, and poor workspace housekeeping.
> Recommend implementing daily pre-shift inspections, retraining operators, and reinforcing lockout/tagout enforcement.

---

Knowledge Context Integration
- Enrich image interpretations with applicable machine operation manuals, environmental compliance policies, and OSHA regulations.
- Apply MACHINE_SAFETY_REV12 and ENVIRONMENT_HEALTH_SAFETY_POLICY standards for all industrial or construction-related images.
- For specific equipment (e.g., CBV Tube Bender), use that machine’s certified operating manual to assess compliance.


## Reference Documentation
Document 1: CBV_Tube_Bender_Manual
--- Page 1 (Azure OpenAI Vision) ---
# Extracted Information from Document
## 1. Text Content
- **Title:** COMCO CNC Tube Bender
- **Subtitle:** WINDOWS PC CONTROL
- **Document Type:** MACHINE OPERATION MANUAL
- **Company Name:** Cambridge Machinery
- **Address:** 1105 Myatt Blvd., Madison, TN 37115
- **Contact Information:**
  - Phone: (615) 860-7773
  - Fax: (615) 860-5256
- **Distributor Information:** Distributor of Comco-Keins Tube Forming Equipment, Japan
- **Version:** 5 April 19, 2006
- **Copyright:** © Copyright 2005
## 2. Tables
(No tables present in the provided document content.)
## 3. Key Data Points and Values
- **Company Name:** Cambridge Machinery
- **Address:** 1105 Myatt Blvd., Madison, TN 37115
- **Phone Number:** (615) 860-7773
- **Fax Number:** (615) 860-5256
- **Version Date:** April 19, 2006
- **Copyright Year:** 2005
## 4. Document Structure
- **Header:**
  - Cambridge Machinery Logo
  - Title: COMCO CNC Tube Bender
  - Subtitle: WINDOWS PC CONTROL
  - Document Type: MACHINE OPERATION MANUAL
- **Contact Information Section:**
  - Company Name
  - Address
  - Phone and Fax Numbers
- **Footer:**
  - Distributor Information
  - Version and Copyright Information
## 5. Forms or Structured Data
(No forms or structured data present in the provided document content.)
--- Page 2 (Azure OpenAI Vision) ---
It appears that the document you provided is blank, as there is no visible text, tables, key data points, or any structured data present. Therefore, I am unable to extract or structure any information from it. If you have another document or additional content to analyze, please provide that, and I would be happy to assist you!
--- Page 3 (Azure OpenAI Vision) ---
# MITSUBISHI WINDOWS PC OPERATION MANUAL
## 1. Text Content
The document contains instructions and information regarding the operation of the Mitsubishi Windows PC. It includes sections on control panel operation, data management, and various settings related to the operation of the machine.
## 2. Tables
The document does not contain any visible tables in the provided content.
## 3. Key Data Points and Values
- **Page Numbers**: Various sections are referenced with specific page numbers, such as:
  - Summary of Control Panel: Page 2
  - How to Turn Electric Power On/Off: Page 4
  - Setting of XYZ 3-D Coordinates: Page 24
  - How to Teach: Page 56
  - Glossary: Page 71
## 4. Document Structure
### Contents
1. Summary of Control Panel, Operation Panel, Operator Pedestal - Page 2
2. How to Turn Electric Power On/Off - Page 4
3. Menu and Icon Layout of Screen - Page 6
4. Ten-Key Input, Calculator, Undo Icon, History of Set Value - Page 10
5. Save Button (Important) - Page 11
6. Creation of New Working Data - Page 12
7. Alteration of File Name, Folder Name, Remarks - Page 15
8. How to Search Working File - Page 15
9. Setting of Working Specification - Page 15
10. Setting of Jig Information - Page 20
11. Setting of XYZ 3-D Coordinates - Page 24
12. Setting of FPB - Page 28
13. Setting of Function - Page 36
14. Setting of Pressure/Pressure Boost Force: Speed - Page 39
15. Setting of Feed Follow Thrust - Page 41
16. Designate Operation - Page 43
17. Automatic Operation - Page 46
18. How to Make Temporary Stop - Page 46
19. How to Outer Article No. Input, Outer Article No. Output - Page 47
20. Return to Original Point - Page 48
21. How to Make Manual Movement (Operation) - Page 49
22. Production Management Screen - Page 53
23. Motion Monitor - Page 54
24. I/O Monitor - Page 55
25. How to Teach - Page 56
26. Data Management - Page 62
27. Editing Sequence Data Copy - Page 65
28. How to Print Out - Page 68
29. Glossary - Page 71
30. Creation of Editing Sequence - Page 99
## 5. Forms or Structured Data
The document does not appear to contain any forms or structured data in the provided content.
---
This structured output summarizes the key elements of the document while preserving the original formatting and organization.
--- Page 4 (Azure OpenAI Vision) ---
# Extracted Information from Document
## 1. Text Content
### Summary of Control Panel, Operation Panel, Operator Pedestal
Summary of control panel, operation panel and operator pedestal of standard bender are described below.
### Control Panel
When you turn breaker ON, electric power is supplied to main circuit. Please turn breaker OFF when you open the door of control panel.
### Operation Panel
Screen for the operation of bender. The buttons on the operation panel do not work unless breaker is ON.
The display is touch panel. When you intend to operate the screen, either touch the screen directly with hand or use the attached touch-pen. Key-board and mouse can be installed by option.
1. **Electric Power On Key-Switch**  
   When you want to turn electric power of the screen ON, insert key to turn it ON. Bender application will start up automatically.
2. **Electric Power Lamp**  
   It lights up if breaker is turned ON.
3. **Operation Preparation On Button (Master On)**  
   It turns electric power of servo and hydraulic pump ON and bender becomes operable condition. When operation preparation is ON, the button lights up green.
## 2. Tables
### Operation Panel Button Layout
| Button          | Description                                                                 |
|-----------------|-----------------------------------------------------------------------------|
| POWER OFF/ON    | Power switch for the operation panel                                         |
| MASTER ON       | Activates the master control for the bender                                 |
| MASTER OFF      | Deactivates the master control for the bender                               |
| AUTO START      | Starts the automatic operation of the bender                                |
| ONCE STOP       | Stops the bender operation once                                            |
| MANUAL          | Switches to manual operation mode                                           |
| RESET           | Resets the bender to initial state                                          |
| EMERGENCY STOP   | Immediate stop button for emergency situations                              |
| BUZZER          | Alerts for operational notifications                                         |
## 3. Key Data Points and Values
- **Electric Power On Key-Switch**: Turns ON the electric power for the screen.
- **Electric Power Lamp**: Indicates if the breaker is ON.
- **Operation Preparation On Button (Master On)**: Activates servo and hydraulic pump.
## 4. Document Structure
- **Header**: Summary of Control Panel, Operation Panel, Operator Pedestal
- **Sections**:
  - Control Panel
  - Operation Panel
    - Description of buttons and their functions
## 5. Forms or Structured Data
- No forms or structured data were identified in the document.
This structured output preserves the essential information and formatting from the original document while organizing it for clarity.
--- Page 5 (Azure OpenAI Vision) ---
# Extracted Information from Document Page
## 1. Text Content
- **OPERATION PREPARATION OFF BUTTON (MASTER OFF)**  
  It turns electric power of servo and hydraulic pump OFF and bender becomes inoperable condition. When operation preparation is OFF, the button lights up red.
- **AUTO START BUTTON**  
  Button for the start of automatic operation. It lights up green during automatic operation. It flashes waiting for auto start button ON during automatic operation.
- **ONCE STOP BUTTON**  
  Button for temporary stop of automatic operation. It lights up red during once stop.
- **AUTO BUTTON**  
  Button for auto mode. It lights up green during auto mode.
- **MANUAL BUTTON**  
  Button for manual mode. It lights up green during manual mode.
- **ORIGINAL POINT RETURN BUTTON**  
  Button to move each moving part to original point position. It lights up green during original point return.
- **RESET BUTTON**  
  Button to release alarm.
- **BUZZER**  
  When alarm occurs, it sounds. Push reset button to stop buzzer.
- **EMERGENCY STOP BUTTON**  
  It turns operation preparation OFF (electric power of servo and hydraulic pumps are OFF). Each moving part stops at once. Please note that those which are driven by 2PD valve do not stop at once.
## 2. Tables
### Operator Pedestal
| Button/Function          | Description                                                                                       |
|-------------------------|---------------------------------------------------------------------------------------------------|
| **CHUCK CLOSE BUTTON**  | Push this button so that chuck may grip pipe during automatic operation. If you push it once more in closed condition, chuck will open and pipe can be re-loaded again. |
| **CYCLE / CONTINUE SELECTION SWITCH** | You can select either continuous cycle or 1 cycle operation. When 1 cycle is selected, the auto cycle will stop after 1 cycle, and when continuous is selected, operation will repeat cycles. |
| **PIECES COUNTER**      | It counts the number of pieces which are produced. The count will be reset if you push the button right lower side of counter. |
## 3. Key Data Points and Values
- **Buttons and Functions:**
  - Master Off Button: Turns off electric power.
  - Auto Start Button: Lights up green during automatic operation.
  - Once Stop Button: Lights up red during once stop.
  - Auto Button: Lights up green during auto mode.
  - Manual Button: Lights up green during manual mode.
  - Original Point Return Button: Lights up green during original point return.
  - Reset Button: Releases alarm.
  - Emergency Stop Button: Stops all operations immediately.
## 4. Document Structure
- **Headers:**
  - Operation Preparation Off Button (Master Off)
  - Auto Start Button
  - Once Stop Button
  - Auto Button
  - Manual Button
  - Original Point Return Button
  - Reset Button
  - Buzzer
  - Emergency Stop Button
  - Operator Pedestal
## 5. Forms or Structured Data
- No specific forms or structured data were identified in the document. The information is primarily presented in text and tabular format.
--- Page 6 (Azure OpenAI Vision) ---
# Extracted Information from Document Page
## 1. Text Content
- **AUTO START BUTTON**  
  Buttons for the start of automatic operation. It has the same function as the [AUTO START] button of operation panel. However, both buttons are required to start the automatic cycle. Automatic start cannot be done with only 1 button.
- **MATERIAL REMOVAL BUTTON**  
  Button for manual part discharge. If you push the button, it unclamps (clamp, pressure and chuck open) and you can take out processed pipe.
- **EMERGENCY STOP BUTTON**  
  It turns operation preparation OFF (electric power of servo, hydraulic pump is turned OFF). Each moving part stops at once. Please note that those which are driven by 2PD valve do not stop at once.
- **ORIGINAL POINT BUTTON**  
  Button to return to pipe supply position of next cycle in automatic operation.
## 2. Tables
### How to Turn Electric Power On/Off
| Step | Action |
|------|--------|
| 1    | First turn breaker of control panel ON. |
| 2    | Turn handle right until it sounds click. |
| 3    | Then turn POWER key switch of operation panel ON. |
| 4    | Insert key and turn right. |
| 5    | PC boots into Windows, then bender application starts automatically. Do NOT shut down during PC startup. |
| 6    | To turn electric power OFF, first turn POWER key switch of operation panel OFF. |
| 7    | Insert key and turn left. |
## 3. Key Data Points and Values
- **Buttons:**
  - Auto Start Button: Required for automatic operation.
  - Material Removal Button: Used for manual part discharge.
  - Emergency Stop Button: Stops operation preparation.
  - Original Point Button: Returns to the next cycle position.
## 4. Document Structure
- **Section 1:** Button Functions
  - Auto Start Button
  - Material Removal Button
  - Emergency Stop Button
  - Original Point Button
- **Section 2:** How to Turn Electric Power On/Off
  - Steps to turn electric power ON
  - Steps to turn electric power OFF
## 5. Forms or Structured Data
- No forms or structured data were identified in the document.
This structured output preserves the essential information and formatting from the original document page.
--- Page 7 (Azure OpenAI Vision) ---
# Document Information Extraction
## 1. Text Content
The shut-down of the PC will start. Turn breaker OFF after the PC has shut down (approximately 30 seconds). If you turn breaker off before you turn key-switch OFF, it might cause PC operating system fault, therefore wait until PC shutdown is complete.
When key-switch or breaker is turned OFF, [electric power can be cut] will be displayed on the screen. After about 1-2 minutes (after about 5 minutes, if breaker is cut before the screen becomes dark) the electric power of the screen will be out automatically. (The display of electric power can be cut will disappear). If you attempt to restart bender BEFORE the shutdown has completed, bender application will not start up.
**Notes:**
Please turn off the key switch once if the bender operation screen freezes. The shutdown of the screen should start. Wait until the bender screen is completely dark (shutdown is complete) before re-starting bender PC.
## 2. Tables
There are no tables present in the document.
## 3. Key Data Points and Values
- **Shutdown Duration:** Approximately 30 seconds
- **Time to Display Electric Power Cut:** 1-2 minutes
- **Time for Screen to Become Dark:** About 5 minutes
- **Action if Screen Freezes:** Turn off the key switch
## 4. Document Structure
- **Main Section:** Shutdown Procedure
  - **Subsection:** Key-switch and Breaker Operation
  - **Notes Section:** Instructions for Screen Freeze
## 5. Forms or Structured Data
There are no forms or structured data present in the document.
--- Page 8 (Azure OpenAI Vision) ---
# Extracted Information from Document
## 1. Text Content
### Menu and Icon Layout of Screen
- **Menu Bar**
  - Contains standard Windows text pull-down menus in which the following commands are registered.
    - **File (F)**
      - **New creation**: New working file can be created. It changes to new creation wizard screen.
      - **Print**: You can print out working file data.
      - **Finish**: You can close the bender application and return to desktop. Input of ID and password is necessary to finish.
    - **Maintenance (M)**
      - **Clock set screen**: Setting of time can be done. Input of ID and password is necessary for this setting.
      - **Setting of parameter**: You can make settings of various parameters, such as setting of timer value of drive part, setting of pressure parameter etc. Input of ID and password is necessary.
      - **Setting of servo parameter**: You can set parameter of AC servo. You can set parameter of AC servo (setting of positioning unit QD75M) here. Input of ID and password is necessary to make setting.
      - **Set original point**: Absolute-encoder is used for the AC servo motor of this bender. You can decide the original point of the motor from here.
## 2. Tables
| Number of Superpositions | Process Counter | File Information |
|--------------------------|-----------------|------------------|
| NO1                      |                 |                  |
| NO2                      |                 |                  |
| NO3                      |                 |                  |
| NO4                      |                 |                  |
| NO5                      |                 |                  |
## 3. Key Data Points and Values
- **Menu Bar Commands**:
  - File:
    - New creation: Changes to new creation wizard screen.
    - Print: Prints out working file data.
    - Finish: Closes application, requires ID and password.
  - Maintenance:
    - Clock set screen: Requires ID and password.
    - Setting of parameter: Requires ID and password.
    - Setting of servo parameter: Requires ID and password.
    - Set original point: Defines original point of AC servo motor.
## 4. Document Structure
- **Header**: Menu and Icon Layout of Screen
- **Sections**:
  - Menu Bar
    - File (F)
    - Maintenance (M)
## 5. Forms or Structured Data
- **Input Requirements**: 
  - ID and password are necessary for:
    - Finishing the application.
    - Clock set screen.
    - Setting of parameters.
    - Setting of servo parameters.
This structured format preserves the essential information from the document while clearly organizing it for easy reference.
--- Page 9 (Azure OpenAI Vision) ---
# Document Extraction
## 1. Text Content
### Editing Sequence Data Copy
You can copy editing sequence data to outer memory device, as well as copy setting of parameter, setting of servo parameter, alarm history, production management to outer memory device.
### Initialize of Data
Initialization of working file, setting of parameter, setting of servo parameter, editing sequence, alarm history, production management, log-in level setting can be done. Input of ID and password is necessary.
### Setting of Login Level
You can set screen operation level.
### Turn-key Input
When item is checked, turn-key will appear after you touch data entry box on the screen. Input of value can be done with turn-key. If item not checked, you must input from optional keyboard.
### Calculator
It displays calculator.
### Communication (C)
Not used yet.
### Help (?)
#### Content
It displays contents of help.
#### Search of Topics
You can search topics of help.
### Version Information
It displays the version of vendor software.
## 2. Tables
### Menu Options
| File (F) | Communication (C) |
|----------|--------------------|
| Clock set screen | Setting of parameter |
| Setting of servo parameter | Set original point |
| Editing sequence data copy | Initialize of Data |
| Setting of login level | Turn-key input |
| Calculator |  |
## 3. Key Data Points and Values
- **Editing Sequence Data Copy**: Copy data to outer memory device.
- **Initialization**: Requires ID and password.
- **Turn-key Input**: Option to check or uncheck for data entry.
- **Calculator**: Available for use.
- **Communication (C)**: Not utilized.
- **Help**: Provides content and search options.
- **Version Information**: Displays vendor software version.
## 4. Document Structure
- **Headers**: 
  - Editing Sequence Data Copy
  - Initialize of Data
  - Setting of Login Level
  - Turn-key Input
  - Calculator
  - Communication (C)
  - Help (?)
  - Version Information
- **Sections**: Each header represents a distinct section with relevant content.
## 5. Forms or Structured Data
- No specific forms or structured data were identified in the document. The content is primarily instructional and descriptive.
--- Page 10 (Azure OpenAI Vision) ---
# Document Extraction
## 1. Text Content
- **Tool bar**  
  Icon toolbar contains most of the bender function and management shortcuts. Push the icon to be used.
You can change to operation designation screen. You can designate working file to operate bender, alter the setting of pieces counter, or change file name and folder name.
You can change to individual operation screen. Screen is used for manual operation of moving parts.
You can change to FPB screen.
You can change to pressure/pressure boost force * speed set, feed follow boost thrust set screen.
You can change to motion monitor screen, where present position of servo, progression of editing sequence, pressure force / feed boost pressures, or flag monitor for editing sequence are observed in real time.
It displays the icon groups for the working specification screen, jig information screen, XYZ coordinate screen, I/O monitor screen, data management screen, alarm history screen, production management screen, etc.
You can change to help screen. Explanation of operation and terms will be displayed.
Undo button. The button to change the most recent numeric value input to the previous value.
Icon button to change to teaching mode. The button will be displayed when FPB screen or motion monitor screen is opened. Push and hold icon for 2 seconds to change to teaching mode after placing bender in AUTO mode. You cannot change to teaching mode during manual operation.
Button to save the edits to the working file data, parameter and servo parameter. When you edit data, please push this button to save. Bender will not use edited data until it is saved.
You can change to working specification screen.
You can change to jig information screen.
You can change to XYZ screen.
You can change to function setting screen.
You can change to new creation wizard. Push this icon when you create new working file.
You can change to data management screen, where you can make copy or transfer of working file, left-right symmetric bend calculation, reverse bend calculation and copy by item.
You can change to editing sequence creation screen. You can modify normal movement of bender, create optional movement, or integrate external process with the bender (autoloader, robot, discharge device, etc.).
You can change to production management screen.
You can change to I/O monitor screen. INPUTS and OUTPUTS are monitored here.
## 2. Tables
(No tables were present in the provided document content.)
## 3. Key Data Points and Values
- **Functionality**: 
  - Operation designation screen
  - Individual operation screen
  - FPB screen
  - Pressure/pressure boost force settings
  - Motion monitor screen
  - Help screen
  - Teaching mode
  - Save edits button
  - Working specification screen
  - Jig information screen
  - XYZ screen
  - Function setting screen
  - New creation wizard
  - Data management screen
  - Editing sequence creation screen
  - Production management screen
  - I/O monitor screen
## 4. Document Structure
- **Header**: Tool bar
- **Sections**:
  - Functionality descriptions
  - Button functionalities
  - Screen navigation options
## 5. Forms or Structured Data
(No forms or structured data were present in the provided document content.)
--- Page 11 (Azure OpenAI Vision) ---
# Extracted Information from Document Page
## 1. Text Content
- You can change to alarm history screen. It displays past alarm history.
- You can print out working file data.
- User name for log-in and password input box will be displayed.
### SELECTION OF WORKING FILE DISPLAYED ON SCREEN
The pull-down menus select the folder name and file name of working files displayed on screen. When you want to display other working file data in the screen, select the folder and file from the FOLDER pull-down menu:
- All 10 folders are displayed. Select folder which contains the working file to be displayed. To select the working file from the folder selected above, use the FILE NAME pull-down menu.
### SCREEN DISPLAY SECTION
The content of selected screen is displayed here.
### STATUS BAR
From left of the screen as follows, description of items on status bar below:
1. File name selected for display
2. Unit of length [mm], [inch]
3. Unit of pressure [MPa], [bar], [kgf/cm²]
4. Present position of feed.
5. Present position of plane.
6. Present position of bend.
7. Log-in level (0 = operator, 1 = management, 2 = manufacturer)
## 2. Tables
### Folder Selection Table
| Folder   |
|----------|
| Folder01 |
| Folder02 |
| Folder03 |
| Folder04 |
| Folder05 |
| Folder06 |
| Folder07 |
| Folder08 |
| Folder09 |
| Folder10 |
### File Name Selection Table
| File name |
|-----------|
| 12345     |
| abcde     |
| test-1    |
### Status Bar Table
| 12345 | mm | MPa  | Feed  | Plane | Bend  |
|-------|----|------|-------|-------|-------|
|       |    | 0.00 | 0.00  | 0.00  | 0.00  |
## 3. Key Data Points and Values
- **File Name Selected for Display:** 12345
- **Unit of Length:** [mm], [inch]
- **Unit of Pressure:** [MPa], [bar], [kgf/cm²]
- **Feed Position:** 0.00
- **Plane Position:** 0.00
- **Bend Position:** 0.00
- **Log-in Levels:** 
  - 0 = operator
  - 1 = management
  - 2 = manufacturer
## 4. Document Structure
- **Header:** SELECTION OF WORKING FILE DISPLAYED ON SCREEN
- **Subsections:**
  - Folder Selection
  - File Name Selection
  - SCREEN DISPLAY SECTION
  - STATUS BAR
## 5. Forms or Structured Data
- **Log-in Input Box:** User name and password input fields (not visually represented in the document but mentioned in the text).
--- Page 12 (Azure OpenAI Vision) ---
# Extracted Information from Document
## 1. Text Content
### TEN-KEY INPUT
Description of number pad input should not be necessary; however, some additional functions are defined below.
- **[M-] Memory minus key**  
  You can reduce numeric value from present input numeric value.
- **[M+] Memory plus key**  
  You can add numeric value to present input numeric value.
- **[BS] Back space**  
  It inputs numeric characters and deletes numeric character of right end of the value which is displayed.
- **[ALL CLR] All clear**  
  It deletes all the value which is displayed.
- **[ESC] Escape**  
  You push this when you cancel the settings or have completed input. When you push this, ten-key will disappear.
- You add 10 to the value displayed on ten-key.
- You add 1 to the value displayed on ten-key.
- You reduce 1 from the value displayed on ten-key.
- You reduce 10 from the value displayed on ten-key.
### CALCULATOR
Calculator will be displayed when you push the calculator of the maintenance menu. You can use it the same as a normal calculator. The calculator will disappear when you push the [ESC] button in the calculator.
### UNDO ICON
You can change the most recent input to immediately preceding set value for any input numeric value. You can return up to a maximum of 5 preceding set values. However, the undo icon becomes invalid if the screen is changed, SAVE is pushed, or the bender is shut down.
## 3. Key Data Points and Values
- Memory minus key: Reduces numeric value from present input.
- Memory plus key: Adds numeric value to present input.
- Back space: Deletes numeric character from the right end of the displayed value.
- All clear: Deletes all displayed values.
- Escape: Cancels settings or completes input.
## 4. Document Structure
- **Header**: TEN-KEY INPUT, CALCULATOR, UNDO ICON, HISTORY OF SET VALUE
- **Sections**:
  - TEN-KEY INPUT
  - CALCULATOR
  - UNDO ICON
## 5. Forms or Structured Data
No specific forms or structured data were identified in the document. The content is primarily instructional text and tables.
--- Page 13 (Azure OpenAI Vision) ---
# Extracted Information
## 1. Text Content
### History of Set Value
- Up to max. 5 set values can be stored for any input numeric value.
- The above box will be displayed when you push set value. If you push the numeric value in the box, the numeric value will be input as set value.
- The history box will disappear when you push the empty part of the top of the history box. If you shut down the bender, all history will be cleared.
### Save Button (Important)
- Bender movement is controlled by selected working file data, settings for number of operations and pieces counter data, editing sequence data, parameter data, and servo parameter data. Input or change of values on screen will not affect bender movement unless you SAVE by pushing the button on the screen. 
- The SAVE button becomes active when the setting in the screen under display is altered from original state after the screen opening. Either the message [Data has changed. Change screen or press SAVE], or [Data has changed. Press SAVE] will be displayed. Please push SAVE button before proceeding. The data will be stored and SAVE will be completed.
- The SAVE procedure for each data input is shown below.
## 2. Tables
### Data Save Procedure
| DATA                                   | PROCEDURE                                               |
|----------------------------------------|--------------------------------------------------------|
| Number of operations                   | No (not necessary to push SAVE button).                |
| Pieces counter                         | No (not necessary to push SAVE button).                |
| Working specification screen           | Push SAVE button of screen right up side, or change to other screen. |
| Jig information screen                 | Push SAVE button of screen right up side, or change to other screen. |
| XYZ screen                             | Push SAVE button of screen right up side, or change to other screen. |
| FPB screen                             | Push SAVE button of screen right up side, or change to other screen. |
| Function set screen                    | Push SAVE button of screen right up side, or change to other screen. |
| Pressure/pressure boost force*speed set screen | Push SAVE button of screen right up side, or change to other screen. |
| Feed follow thrust set screen          | Push SAVE button of screen right up side, or change to other screen. |
| Sequence before bend                   | No (not necessary to push SAVE button).                |
| Sequence after bend                    | No (not necessary to push SAVE button).                |
| Sub-program1-25 (editing sequence data)| Push SAVE button in the edit sequence screen (lower side of screen). |
| Parameter                              | Push SAVE button of screen right up side.              |
| Servo parameter                        | Push SAVE button of screen right up side.              |
## 3. Key Data Points and Values
- Maximum set values stored: 5
- Importance of SAVE button: Necessary for storing data changes.
## 4. Document Structure
- **Header**: HISTORY OF SET VALUE
- **Section**: Save Button (Important)
- **Subsection**: Data Save Procedure
## 5. Forms or Structured Data
- No specific forms were identified in the document. The structured data is presented in the table format above.
--- Page 14 (Azure OpenAI Vision) ---
# Document Extraction
## 1. Text Content
### Creation of New Working Data
Push this icon to run new program creation wizard.
Red circles indicate compulsory input items. You cannot proceed to the next screen unless you input values indicated by the red circle. During new creation, the new file name is displayed at the top of the screen.
### File Name Input Screen
You input new working file name and remarks. The file name is a compulsory input item. You can input up to 20 single-space alphanumeric characters for file name and up to 40 characters for remarks.
When you input file name, [Do you create new data based on already existing file?] will be displayed. When you select [Yes], it will change to the data copy screen. When you select [No], it will proceed to new file creation.
- **Yes**: Proceed to the screen to copy from existing file.
- **No**: Proceed to jig information screen.
- **Cancel**: New creation wizard will complete. The incomplete file will not be stored. Answer YES to exit wizard without saving.
### Jig Information Screen
Area for input of tooling dimensions. Since the dimensions of tooling are used for the calculation of interference positions, please make the settings carefully. If the setting is not correct, it might cause malfunction or damage of bender.
Please refer to the item of jig information for the details.
- **BF max. value**, **PD max. value**, and **CH max. value** are compulsory input items. In case of bender with wiper equipment, if "with WD" is checked, **WD max. value** becomes compulsory input item. In case of bender of KBB series with mandrel equipment, if "with M" is checked, **M max. value** becomes compulsory input item.
- **Back**: Return to file name input screen.
- **Next**: Proceed to working specification screen.
- **Cancel**: New creation wizard will complete. The incomplete file will not be stored. Answer YES to exit wizard without saving.
### Working Specification Screen
You can make settings of working specification. Please refer to the item of working specification for the details.
Number of bends and each interference position are compulsory input items. Also, if both bend radius are shown as 0.00 [mm] you cannot proceed to next screen (error "Bend Radius is not input"). At least one radius must be input to proceed.
- **Back**: Returns to jig information screen.
- **XYZ**: Proceed to XYZ coordinate input screen.
- **FPB**: Proceed to FPB screen.
- **Cancel**: New creation wizard will complete. The incomplete file will not be stored. Answer YES to exit wizard without saving.
## 2. Tables
No tables were present in the document.
## 3. Key Data Points and Values
- **File Name**: Up to 20 alphanumeric characters.
- **Remarks**: Up to 40 characters.
- **Compulsory Input Items**:
  - BF max. value
  - PD max. value
  - CH max. value
  - WD max. value (if applicable)
  - M max. value (if applicable)
- **Bend Radius**: At least one radius must be input to proceed.
## 4. Document Structure
- **Header**: Creation of New Working Data
- **Sections**:
  - File Name Input Screen
  - Jig Information Screen
  - Working Specification Screen
## 5. Forms or Structured Data
- **Input Options**:
  - Yes / No / Cancel (in File Name Input Screen)
  - Back / Next / Cancel (in Jig Information Screen)
  - Back / XYZ / FPB / Cancel (in Working Specification Screen)
This structured output preserves the essential information from the document while organizing it for clarity.
--- Page 15 (Azure OpenAI Vision) ---
# Extracted Information from Document Page
## 1. Text Content
### XYZ COORDINATE INPUT SCREEN
In order to create FPB data, input coordinates of start of pipe, bend points, and rear of pipe, then “calculate”. Please refer to items of XYZ 3-d coordinate for the details.
Number of bends and bend radius are compulsory input items. However, these values were input in the working specification screen so re-input should not be necessary. You cannot proceed to next screen unless valid XYZ coordinates are input. If the calculation is correct, the red circle beside calculation button will disappear.
- **Calculation**: FPB data will be calculated.
- **Back**: Return to working specification screen.
- **Next**: Proceed to FPB screen.
- **Cancel**: New creation wizard will complete. The incomplete file will not be stored. Answer YES to exit wizard without saving.
### FPB SCREEN
Screen to input settings for pipe supply position and motion at the time of bend start, settings of detailed motion for each process (movement amount of Feed, Plane, Bend), interruption motion, sequence before bend and sequence after bend. Please refer to item of FPB for the details.
- **Back**: Return to previous opened screen (working specification screen or XYZ screen).
- **Next**: Proceed to pressure/pressure boost force-speed set screen (KBB series or programmable pressure option). Otherwise, it proceeds to selection screen or function screen (standard bender).
- **Cancel**: New creation wizard will complete. The incomplete file will not be stored.
### PRESSURE/PRESSURE BOOST FORCE-SPEED SET SCREEN
Setting of pressure close force, pressure boost force and speed of pressure boost are done. Please refer to items of pressure/pressure boost force-speed for details.
- **Back**: Return to FPB screen.
- **Next**: Proceeds to selection screen.
- **Cancel**: New creation wizard will complete. The file will not be stored.
### SELECTION SCREEN
You can select function and whether you make settings of feed follow thrust (KBB series bender only) or not.
- **Back**: Returns to pressure/pressure boost force-speed set screen (KBB and machines with electronically programmed pressure close / boost force) or FPB screen (standard bender).
- **Next**: At the selection of editing or not, it will change to [Yes] selected screen in rotation. In case of both [No] (in case of KB series bender, function set only) it changes to SAVE screen.
- **Cancel**: New creation wizard will complete. The file will not be stored.
## 2. Tables
No tables were present in the document.
## 3. Key Data Points and Values
- **Input Requirements**: Coordinates of start of pipe, bend points, rear of pipe.
- **Compulsory Input Items**: Number of bends, bend radius.
- **Screen Navigation Options**:
  - Calculation
  - Back
  - Next
  - Cancel
## 4. Document Structure
- **Header**: XYZ COORDINATE INPUT SCREEN
- **Sections**:
  - XYZ Coordinate Input Screen
  - FPB Screen
  - Pressure/Pressure Boost Force-Speed Set Screen
  - Selection Screen
## 5. Forms or Structured Data
The document contains structured navigation options (buttons) for user interaction:
- **Buttons**:
  - Calculation
  - Back
  - Next
  - Cancel
This structured data indicates user actions available on each screen.
--- Page 16 (Azure OpenAI Vision) ---
# Extracted Information from Document Page
## 1. Text Content
### FUNCTION SCREEN
You can make settings of each function, such as alteration of motion by one touch (some of the machine cannot do it) or, when optional device is installed, setting to fulfill the function. Please refer to item of function for the details.
- **Back**: Returns to selection screen.
- **Next**: When editing of feed follow thrust set is selected in the selection screen, it proceeds to feed follow thrust set screen. In case of [No] selection, and if KB series bender is used, it changes to SAVE screen.
- **Cancel**: New creation wizard will complete. The file will not be stored.
### FEED FOLLOW THRUST SET SCREEN
Thrust of feed follow boost to push pipe from backside during bend motion is set. Please refer to feed follow thrust setting for details. It is not necessary to set for KB series benders.
- **Back**: If function screen was edited, it returns to function screen, otherwise it returns to selection screen.
- **Next**: Changes to SAVE screen.
- **Cancel**: New creation wizard will complete. The file will not be stored.
### CREATION SCREEN BY COPYING FROM EXISTING WORKING FILE DATA
If you chose to "create new data from existing file" at the beginning of the new creation wizard you will be taken to this screen. This screen allows selection of a file from the 10 folders on the C: drive for purpose of new file creation. The items of an existing file must be selected for copy into the new file by placing a check beside the item. If an item is not selected for copy the values of the new program will be set to defaults. If working file to be copied is not selected or there are no items of program selected for copy, you cannot proceed to next screen.
- **Back**: Returns to file name input screen.
- **Next**: Changes to SAVE screen.
- **Cancel**: New creation wizard will complete. The file will not be stored.
### SAVE SCREEN
You can designate folder to save new file creation.
- **Alteration of file name and folder name**: You can alter the file name that was input from the earlier screen.
  - **Under creation now**: test-2
  - **What folder do you save it?**
  
If you push box in which file name is displayed, soft keyboard will be displayed and you can input new file name.
You can alter folder names from the SAVE screen prior to saving new file:
- Select folder to be altered and push [Alteration of folder name] button to display [Alteration of folder name] input screen. When you push new folder name box, soft key-board will be displayed. You can alter with [execution] button and cancel the alteration of folder name with [cancel] button.
## 2. Tables
There are no explicit tables in the provided content, but the structured data can be represented in a list format.
## 3. Key Data Points and Values
- **File Name Under Creation**: test-2
- **Folder Name Input**: Not specified (prompted for user input)
## 4. Document Structure
- **Headers**:
  - FUNCTION SCREEN
  - FEED FOLLOW THRUST SET SCREEN
  - CREATION SCREEN BY COPYING FROM EXISTING WORKING FILE DATA
  - SAVE SCREEN
- **Sections**: Each header represents a distinct section with specific functionalities and options.
## 5. Forms or Structured Data
- **Buttons**:
  - Back
  - Next
  - Cancel
- **Input Fields**:
  - File name input
  - Folder name input
This structured output preserves the content and organization of the original document while clearly delineating the various components.
--- Page 17 (Azure OpenAI Vision) ---
# Document Extraction and Structuring
## 1. Text Content
- **Back**: You can return to proceeding screen.
- **Save**: After storage to designated folder, it changes to operation designation screen and completes new creation wizard.
- **Cancel**: New creation wizard will complete. The file will not be stored.
### ALTERATION OF FILE NAME, FOLDER NAME, REMARKS
- When you intend to change file name, select file to be altered in operation designation screen, and push [alteration of file name].
- When you intend to change folder name, select folder to be changed in operation designation screen, and push [alteration of folder name]. You can also alter it in the SAVE screen of new creation wizard.
- If you intend to alter remarks, when you push the row of remarks displayed in the file list of operation designation screen, soft key-board will be displayed. You can input new remarks from here.
### HOW TO SEARCH WORKING FILE
- The search function can locate a file by name from the possible 1000 files saved in the 10 folders. You input key-board to search character string and push [search start] button to list up working files which meet the conditions. You can check the folder name among the list of working files found.
- [Search character string] Input character string to search here. However, it does not distinguish between uppercase and lowercase of alphabetic characters.
- [Interruption] When you start search in wrong key word, click suspend and re-start search again.
### SETTING OF WORKING SPECIFICATION
- Push icon to change to working specification screen. Data changes will be stored when SAVE button is pushed or screen is changed.
#### BEND RADIUS
- [Input bend radius of BF for each step. They are (from bottom to top) R1, R2, R3, etc. These items are same as [bend radius] in XYZ screen.]
#### NUMBER OF BENDS
- Value for number of bends used for calculation of XYZ 3-D coordinates and to set the number of process lines for FPB data. Number of bends is not the same as number of coordinates; end points, POINT JUMP R and 180° bend settings increase the number of coordinates. Please input EXACT number of bends. This is same item as [number of bends] of FPB screen and XYZ screen.
#### BEND METHOD
- There are 2 kinds of carriage motion to bend pipe as listed below. Choose the method in accordance with the sort of pipe and bend process desired. These items are same as [bend method] of FPB screen.
## 2. Tables
No tables were present in the document.
## 3. Key Data Points and Values
- **File Name Change**: [alteration of file name]
- **Folder Name Change**: [alteration of folder name]
- **Search Functionality**: Up to 1000 files in 10 folders.
- **Bend Radius**: R1, R2, R3, etc.
- **Number of Bends**: Exact number of bends required.
- **Bend Method**: Two kinds of carriage motion.
## 4. Document Structure
- **Headers**:
  - ALTERATION OF FILE NAME, FOLDER NAME, REMARKS
  - HOW TO SEARCH WORKING FILE
  - SETTING OF WORKING SPECIFICATION
- **Sections**:
  - Bend Radius
  - Number of Bends
  - Bend Method
## 5. Forms or Structured Data
No forms or structured data were present in the document.
--- Page 18 (Azure OpenAI Vision) ---
# Document Extraction and Structuring
## 1. Text Content
- **In sequence**
  - Part is loaded into chuck against solid tube stop. Pipe is gripped through entire process and carriage moves forward after every bend (except for chuck recapture motion of interruption motion and final process). Referred to as "carriage feed".
- **GP**
  - This method is used for either long pipe or small diameter / flexible pipe. The pipe is loaded through the collet and a tube stop is not normally used. The chuck will release pipe and retract the amount of each feed prior to the bend, then advance after the bend.
  - As the chuck is open during the bend process, you cannot add pressure from backside with feed follow boost or you cannot move feed with torque limit, unless you make variable elongation correction of function ON. Referred to as "hitch feed".
- **PIPE SUPPLY POSITION**
  - Input the position of carriage for loading of part. Value must be greater than the bend interference position.
  - Input speed of feed for movement to pipe supply position.
  - This is the same item as [pipe supply position] in the FPB screen.
- **DIE CHANGE**
  - Please set [No], if you do not want to make die change motion during motion. If [No] is set, changing the step position of FPB screen or pipe supply step position will alter all step positions to the same set value. Changing the step position of XYZ screen will also change all step values to the same position.
  - In case of [Yes] setting, step position is set here. If change is required for loading or otherwise this must be set to [YES].
- **ARTICLE No.**
  - This is used when operation designation is done by device external to the bender. A number from 0~999 is allotted to working file. In accordance with this number, exchange of signal with outer device is done.
  - If you push O or article No. register map, you can input corresponding number. The number which is not registered to article No. list is displayed as O and the number which is registered is displayed as ●.
  - You can allot the same number in the different working file, but you cannot register the working file of the same article number in article number list.
- **PIPE EFFECTIVE LENGTH**
  - It shows movable range of feed. Feed can move only in this range. This is the machine feed maximum travel.
- **INTERFERENCE POSITION**
  - As these values prevent collision of the bender with the tooling, they must be entered precisely.
- **BF (BEND DIE INTERFERENCE POSITION)**
  - Chuck
  - Top of chuck
  - Top of BF liner
## 2. Tables
There are no explicit tables present in the document.
## 3. Key Data Points and Values
- **Carriage Feed**: Process of moving the carriage forward after each bend.
- **Pipe Supply Position**: Must be greater than the bend interference position.
- **Die Change Setting**: Options are [No] or [Yes].
- **Article Number Range**: 0 to 999.
- **Pipe Effective Length**: Maximum travel range for feed.
- **Interference Position**: Values must be entered to prevent collision.
## 4. Document Structure
- **Headers/Sections**:
  - In sequence
  - GP
  - PIPE SUPPLY POSITION
  - DIE CHANGE
  - ARTICLE No.
  - PIPE EFFECTIVE LENGTH
  - INTERFERENCE POSITION
  - BF (BEND DIE INTERFERENCE POSITION)
## 5. Forms or Structured Data
There are no forms or structured data present in the document.
---
This structured output preserves the content and organization of the original document while clearly delineating the various sections and key points.
--- Page 19 (Azure OpenAI Vision) ---
# Extracted Information
## 1. Text Content
When feed advances like above photo, the position where top of chuck touches the BF liner first is called bend die interference position. However, the shape of chuck or the bend dies may cause collision (example - see above "triangle" etc). With unique shape tools, please check interference position by JOG operation or moving feed axis by hand. Then move bend arm where the tooling is at the most AFT position (example - move bend arm above until "triangle" tip is pointed at chuck jaws). You can check present position of feed on the STATUS BAR at the bottom of the screen. Use the present position copy or input bend die interference position directly to ensure accurate collision point.
When the [set at interference position of each step] of jig information is selected, movement uses R1BF interference position when chuck table is in R1, and R2BF interference position when it is in R2. When [set at interference position of each step] is not selected, it uses the MAX BF interference position, no matter if chuck table is in R1 or R2.
## 2. Tables
### PD (PRESSURE DIE INTERFERENCE POSITION)
| Chuck | Pressure |
|-------|----------|
| Top of chuck | End of pressure |
Shown in the above photo, when feed advances in the state of closed pressure, the position where top of chuck pressure first is called pressure die interference position. However, the shape of chuck or the pressure dies may cause collision. With unique shape tools, please check interference position by JOG operation or moving feed axis by hand.
When interference position is decided by inputting dimension of jig, but feed still advances beyond collision point and strikes pressure die, please input pressure die interference position directly and adjust it.
You can check present position of feed on the STATUS BAR at the bottom of the screen. Use the present position copy or input pressure die interference position directly to ensure accurate collision point.
When the [set at interference position of each step] of jig information is selected, movement uses R1PD interference position if chuck table is in R1, and R2PD interference position if it is in R2. When [set at interference position of each step] is not selected, it uses the MAX PD interference position, no matter if chuck table is in R1 or R2.
When pressure is closed, feed cannot advance more than pressure die interference position, but when pressure is open, feed can move neglecting pressure die interference position. Also, if present position of feed ≤ pressure die interference position, pressure is set not to close.
## 3. Key Data Points and Values
- **Bend Die Interference Position**: Position where the top of the chuck touches the BF liner first.
- **Pressure Die Interference Position**: Position where the top of the chuck pressure touches first.
- **Status Bar**: Used to check the present position of feed.
- **Interference Position Selection**: 
  - R1BF for chuck table in R1
  - R2BF for chuck table in R2
  - MAX BF interference position when not selected
- **Pressure Settings**: 
  - Cannot advance more than pressure die interference position when closed.
  - Can move neglecting pressure die interference position when open.
## 4. Document Structure
- **Introduction**: Explanation of bend die interference position.
- **Pressure Die Interference Position**: Detailed description and instructions.
- **Interference Position Selection**: Guidelines on selecting interference positions based on chuck table status.
## 5. Forms or Structured Data
- **Interference Position Settings**: 
  - [set at interference position of each step] (checkbox or selection option)
  - Current chuck table status (R1 or R2)
  - Current position of feed (input field)
This structured output preserves the essential information from the document while organizing it for clarity and ease of understanding.
--- Page 20 (Azure OpenAI Vision) ---
# Extracted Information
## 1. Text Content
### WD (WIPER DIE INTERFERENCE POSITION)
When bender has wiper device and wiper is installed, chuck table could interfere with wiper. Therefore, it is necessary to put check mark in [Yes] check box by the WD row of jig information screen. Box for set value of wiper interference will be displayed.
**Top of chuck**  
**Top of wiper**  
- Chuck
- Wiper holder
- Wiper
Wiper die interference position needs to be set only when using wiper device. Shown in the above photo, when feed advances, the position where top of chuck touches wiper first is called wiper die interference position. However, the shape of chuck or the wiper dies may cause collision. With unique shape tools, please check interference position by JOG operation or moving feed axis by hand. You can check present position of feed on the STATUS BAR at bottom of screen. Use the present position copy or input wiper die interference position directly to ensure accurate collision point.
When the [set at interference position of each step] of jig information is selected, movement uses R1WD interference position if chuck table is in R1, and R2WD interference position if it is in R2. When [set at interference position of each step] is not selected, it uses the MAX WD interference position, no matter if chuck table is in R1 or R2.
### M (MANDREL INTERFERENCE POSITION)
This setting is required when mandrel interferes with stopper. Either put check mark in [Yes] check box on the M row of jig information screen, or set mandrel function ON. Box for set value of mandrel interference will be displayed.
- **Stopper**
- **Mandrel**
a. Feed standard point (point of load contact for standard tube stop) - point where "present feed position" is based.  
b. Front of "extended" hollow tube stop.  
c. Mandrel with large shank that will not pass thru hollow tube stop.
## 2. Tables
| **Position** | **Description** |
|--------------|------------------|
| Top of chuck | - |
| Top of wiper | - |
| Chuck        | - |
| Wiper holder | - |
| Wiper       | - |
## 3. Key Data Points and Values
- **Wiper Die Interference Position**: Set when using wiper device.
- **Check Mark**: Required in [Yes] box for WD row of jig information.
- **Interference Position**: Uses R1WD or R2WD based on chuck table position.
- **Mandrel Interference Position**: Required when mandrel interferes with stopper.
## 4. Document Structure
- **Section 1**: WD (Wiper Die Interference Position)
  - Description of the wiper die interference position and its settings.
- **Section 2**: M (Mandrel Interference Position)
  - Description of the mandrel interference position and its settings.
## 5. Forms or Structured Data
- **Checkboxes**:
  - [Yes] for Wiper Die Interference Position
  - [Yes] for Mandrel Interference Position
This structured output preserves the essential information and formatting from the document page provided.
--- Page 21 (Azure OpenAI Vision) ---
# Extracted Information from Document Page
## 1. Text Content
- When mandrel diameter is smaller than the pass-thru hole of the tube stop, feed can advance without colliding against mandrel and it is not necessary to input mandrel interference position.
- When mandrel has a diameter that is larger than the hole in the tube stop, it is necessary to input mandrel interference position to prevent collision of feed with rear of mandrel.
- The value for mandrel interference position is based on the mandrel in the retracted state (mandrel AFT). When mandrel is in advance state (mandrel FWD), the interference is calculated automatically based on stroke of mandrel cylinder, so the interference position advances forward when mandrel is forward.
- When the tube stop length or the shape of the mandrel is not standard, please check interference position manually by JOG operation or by moving feed by hand. You can check present position of feed on the STATUS BAR at the bottom of the screen. When you input mandrel interference position directly, make sure the mandrel is in retract state.
### PIPE SUPPORTER
- When feed moves forward beyond this value, pipe supporter starts to drop to avoid collision with carriage. The pipe supporter must start motion before the feed reaches the pipe supporter as it must move out of the way of the carriage. Therefore be sure to input value that allows the pipe supporter to fully retract before the carriage approaches it.
### MID SUPPORTER (optional)
- When feed moves forward beyond this value, mid supporter starts to drop to avoid collision with carriage. The mid supporter must start motion before the feed reaches the mid supporter as it must move out of the way of the carriage. Therefore be sure to input value that allows the mid supporter to fully retract before the carriage approaches it.
### Note on Interference Position Monitoring
- The distance from present position of feed to each interference position is monitored. When the [set at interference position of each step] of jig information is checked, the BF, PD, WD interference distance is monitored based on the step position of the chuck table.
### PRESENT POSITION COPY
- The function to copy feed present position (shown in status bar) into the selected value. Select the value to set by touching until the “pink bars” are shown below.
- When [present position copy] button is pushed in the state, feed present position will be copied to set place surrounded by pink. Present position copy button beside pipe supply position copies to pipe supply position, and present position copy button in the interference position frame makes it for all values within interference position frame.
### FEED JOG [ADVANCE][RETRACT]
- You can make JOG motion of feed. Use to position feed for verification of interference and pipe supply values.
## 2. Tables
| Parameter                | Value       |
|--------------------------|-------------|
| Pipe supply position      | 30000 rpm   |
| Speed                    | 5           |
## 3. Key Data Points and Values
- Mandrel interference position: Required when mandrel diameter > hole in tube stop.
- Pipe supporter: Must retract before carriage approaches.
- Mid supporter: Must retract before carriage approaches.
- Present position copy: Copies current feed position into selected value.
- Pipe supply position: 30000 rpm
- Speed: 5
## 4. Document Structure
- **Introduction**
  - Mandrel diameter considerations
- **PIPE SUPPORTER**
  - Functionality and requirements
- **MID SUPPORTER (optional)**
  - Functionality and requirements
- **Note on Interference Position Monitoring**
- **PRESENT POSITION COPY**
  - Functionality and usage
- **FEED JOG [ADVANCE][RETRACT]**
  - Functionality and usage
## 5. Forms or Structured Data
- No specific forms were identified in the provided content. The structured data is primarily in the form of parameters and their corresponding values.
--- Page 22 (Azure OpenAI Vision) ---
# Extracted Information from Document
## 1. Text Content
**SETTING OF JIG INFORMATION**  
Input of tool dimensions to calculate interference positions with carriage is set. These settings must be made carefully as they prevent collision of moving parts and damage to machine.
Push this icon to change to jig information screen. Each data will be stored when SAVE button is pushed or screen is changed.
**BF (BF LINER RADIUS, BF RADIUS)**  
BF liner radius • • • Input radius of BF liner.  
R1BF • • • When chuck table is in R1 position, input the distance where chuck table interferes with BF.  
R2BF • • • When chuck table is in R2 position, input the distance where chuck table interferes with BF.  
R3BF • • • When chuck table is in R3 position, input the distance where chuck table interferes with BF.  
It becomes R1, 2, 3, • • • from low step.
Bend radius of working specification and of XYZ screen are different settings than the BF (bend form) setting. This setting is only to calculate interference position based on maximum contact points.
The BF max. value is calculated based on dimension of BF liner radius, R1BF, R2BF and R3BF and input automatically. You can input it directly too.
Since interference position with chuck table is calculated automatically, it is necessary to input correctly.  
When [To set up the interference position at each steps] is not selected:  
BF interference position = BF max. value + chuck end length + 5 [mm]
When [To set up the interference position at each steps] is selected:  
R1BF interference position = R1BF + chuck end length + 5 [mm]  
R2BF interference position = R2BF + chuck end length + 5 [mm]  
R3BF interference position = R3BF + chuck end length + 5 [mm]
## 2. Tables
| Parameter                       | Description                                           |
|---------------------------------|-------------------------------------------------------|
| BF liner radius                 | Input radius of BF liner.                             |
| R1BF                            | Distance where chuck table interferes with BF (R1).   |
| R2BF                            | Distance where chuck table interferes with BF (R2).   |
| R3BF                            | Distance where chuck table interferes with BF (R3).   |
| BF max. value                   | Calculated based on dimensions of BF liner radius, R1BF, R2BF, R3BF. |
| Interference position (not selected) | BF interference position = BF max. value + chuck end length + 5 [mm] |
| R1BF interference position       | R1BF + chuck end length + 5 [mm]                     |
| R2BF interference position       | R2BF + chuck end length + 5 [mm]                     |
| R3BF interference position       | R3BF + chuck end length + 5 [mm]                     |
## 3. Key Data Points and Values
- BF liner radius: Input radius of BF liner.
- R1BF, R2BF, R3BF: Distances where the chuck table interferes with BF at respective positions.
- BF max. value: Calculated based on dimensions of BF liner radius, R1BF, R2BF, R3BF.
- Interference position calculations:
  - Not selected: BF interference position = BF max. value + chuck end length + 5 [mm]
  - Selected:
    - R1BF interference position = R1BF + chuck end length + 5 [mm]
    - R2BF interference position = R2BF + chuck end length + 5 [mm]
    - R3BF interference position = R3BF + chuck end length + 5 [mm]
## 4. Document Structure
- **Header**: SETTING OF JIG INFORMATION
- **Sections**:
  - Introduction to jig information settings
  - Description of BF (BF LINER RADIUS, BF RADIUS)
  - Explanation of interference positions and calculations
## 5. Forms or Structured Data
- The document does not contain any explicit forms but includes structured data in the form of calculations for interference positions based on selected options.
--- Page 23 (Azure OpenAI Vision) ---
# Extracted Information from Document Page
## 1. Text Content
### PD (PRESSURE LENGTH)
- Input this length
- R1PD: When chuck table is in R1 position, input the distance from bend center to the place where chuck table interferes with pressure.
- R2PD: When chuck table is in R2 position, input the distance from bend center to the place where chuck table interferes with pressure.
- R3PD: When chuck table is in R3 position, input the distance from bend center to the place where chuck table interferes with pressure.
- It becomes R1, R2, R3... from low step.
- The PD max value is calculated based on the dimension of R1PD, R2PD, and R3PD and input automatically. You can input it directly too.
### Interference Position Calculation
- Since interference position with chuck table is calculated automatically, it is necessary to input correctly.
- When [To set up the interference position at each step] is not selected:
  - PD interference position = PD max value + chuck end length + 5 [mm]
- When [To set up the interference position at each step] is selected:
  - R1PD interference position = R1PD + chuck end length + 5 [mm]
  - R2PD interference position = R2PD + chuck end length + 5 [mm]
  - R3PD interference position = R3PD + chuck end length + 5 [mm]
### Chuck Tip Length
- When chuck is open
  - Position where pipe hits stopper (standard point of feed)
- When chuck is closed
  - Input this length
  - Top of chuck
- Since it is used to calculate automatically the interference position with chuck table, it is necessary to input correctly.
## 2. Tables
| Position | Description |
|----------|-------------|
| R1PD    | When chuck table is in R1 position, input the distance from bend center to the place where chuck table interferes with pressure. |
| R2PD    | When chuck table is in R2 position, input the distance from bend center to the place where chuck table interferes with pressure. |
| R3PD    | When chuck table is in R3 position, input the distance from bend center to the place where chuck table interferes with pressure. |
## 3. Key Data Points and Values
- PD max value: Calculated based on dimensions of R1PD, R2PD, and R3PD.
- Interference position calculations:
  - PD interference position = PD max value + chuck end length + 5 [mm]
  - R1PD interference position = R1PD + chuck end length + 5 [mm]
  - R2PD interference position = R2PD + chuck end length + 5 [mm]
  - R3PD interference position = R3PD + chuck end length + 5 [mm]
## 4. Document Structure
- **Header**: PD (PRESSURE LENGTH)
- **Sections**:
  - Input Length
  - Interference Position Calculation
  - Chuck Tip Length
    - When chuck is open
    - When chuck is closed
## 5. Forms or Structured Data
- Input fields for lengths:
  - Input length for R1PD, R2PD, R3PD
  - Input length for chuck tip when open and closed
This structured format preserves the content and organization of the original document while making it easier to read and understand.
--- Page 24 (Azure OpenAI Vision) ---
# Extracted Information
## 1. Text Content
**WD (WIPER LENGTH)**  
When wiper device exists and wiper is installed, chuck table could interfere with wiper. Therefore it is necessary to make this setting. When you set, please put check mark in [Yes] check box on the WD row. WD interference position will now be displayed in the working specification screen.
**Input this length**  
- R1WD: When chuck table is in R1 position, input the distance from bend center to the place where chuck table interferes with wiper.  
- R2WD: When chuck table is in R2 position, input the distance from bend center to the place where chuck table interferes with wiper.  
- R3WD: When chuck table is in R3 position, input the distance from bend center to the place where chuck table interferes with wiper. It becomes R1, 2, 3, ... from low step.
Since interference position with chuck table is calculated automatically, it is necessary to input correctly.  
When [To set up the interference position at each step] is not selected:  
- WD interference position = PW max. value + chuck end length + 5 [mm]
When [To set up the interference position at each step] is selected:  
- R1WD interference position = R1PW + chuck end length + 5 [mm]  
- R2WD interference position = R2PW + chuck end length + 5 [mm]  
- R3WD interference position = R3PW + chuck end length + 5 [mm]
## 2. Tables
There are no explicit tables in the document, but the information is structured in a list format.
## 3. Key Data Points and Values
- **R1WD**: Distance from bend center to chuck table in R1 position.
- **R2WD**: Distance from bend center to chuck table in R2 position.
- **R3WD**: Distance from bend center to chuck table in R3 position.
- **WD interference position**: 
## 4. Document Structure
- **Header**: WD (WIPER LENGTH)
- **Sections**:
  - Introduction to the wiper device and chuck table interference.
  - Instructions for inputting distances for different chuck table positions (R1, R2, R3).
  - Explanation of interference position calculations.
## 5. Forms or Structured Data
There are no forms present in the document, but there are structured instructions for inputting data related to the chuck table positions.
--- Page 25 (Azure OpenAI Vision) ---
# Extracted Information from Document Page
## 1. Text Content
**M (MANDREL LENGTH)**  
When mandrel device does not exist, mandrel device exists but not used, or mandrel has the shape to pass through stopper like photo below, it is not necessary to input mandrel length.
If mandrel can move inside stopper to position [a] shown in the photo below, it is not necessary to input mandrel length. But if it can move only to position [b], input the length between [a - b]; if it can move only to position [c], input the length between [a - c]. Since interference position with stopper is calculated automatically, it is necessary to input correctly. Either put check mark in [Yes] check box on the M row of jig information screen, or set mandrel function ON. Box for set value of mandrel interference will be displayed.
**Mandrel interference position = M max. value + mandrel cylinder stroke + 5 [mm]**
Note: a stands for the position of bend center when mandrel is in advance state.
**To set up the interference position at each step**  
When chuck table is in R1 or R2, it could happen that interference position is different. If you make use of it, you can set interference position at each step, by putting check mark in this setting.
---
## 2. Tables
*No tables were present in the document.*
---
## 3. Key Data Points and Values
- **Mandrel interference position formula:**  
  Mandrel interference position = M max. value + mandrel cylinder stroke + 5 [mm]
---
## 4. Document Structure
- **Header:** M (MANDREL LENGTH)
- **Sections:**
  - Description of mandrel length input requirements.
  - Explanation of mandrel interference position calculation.
  - Note regarding the position of bend center.
  - Instructions for setting up interference position at each step.
---
## 5. Forms or Structured Data
*No forms or structured data were present in the document.*
--- Page 26 (Azure OpenAI Vision) ---
# Extracted Information from Document
## 1. Text Content
### Setting of XYZ 3-D Coordinates
- **Number of bends**  
  The same value as [number of bends] in working specification screen and FPB screen.
- **Bend Radius**  
  The same value as [bend radius] in working specification screen.
The bender will create FPB data by conversion of coordinates for each bend and for each end of the pipe. The following explains the values of the coordinates.  
Screen data will be stored when the SAVE button is pushed or the screen is changed.
### How to Take Coordinate
Orientation of coordinate axis is decided as follows.
### Views
- **Top view**
- **Left side view**
- **Plan view**
- **Right side view**
- **Bottom view (Front view)**
If the orientation is wrong, the calculated rotation of the plane will be opposite of the required position.
The bender accepts absolute coordinate values. This means the origin point value (X=0, Y=0, and Z=0) is not a required value as long as all coordinates are referenced to the same origin (absolute) and not referenced to the preceding value (incremental).
However, when creating coordinates from a drawing, it is easier to select a point as the origin and use that point as the origin point value. This is done in the following example.
## 3. Key Data Points and Values
- **Number of Bends**: Same as [number of bends] in working specification screen and FPB screen.
- **Bend Radius**: Same as [bend radius] in working specification screen.
- **Origin Point Values**: X=0, Y=0, Z=0 (not required).
---
## 4. Document Structure
- **Header**: Setting of XYZ 3-D Coordinates
- **Sections**:
  - Number of Bends
  - Bend Radius
  - How to Take Coordinate
  - Views (Top, Left Side, Plan, Right Side, Bottom)
  - Notes on Orientation and Coordinate Values
---
## 5. Forms or Structured Data
- No specific forms or structured data were identified in the document. The information is primarily textual and diagrammatic.
--- Page 27 (Azure OpenAI Vision) ---
# Extracted Information
## 1. Text Content
**Example** - making data of pipe with outer diameter 25.4 [mm] into the following process shape using coordinate print (print with dimensions measured from coordinate intersect points).
Input the number of bends and the bend radius. Set 2 for number of bends. Then input bend radius of 40mm. Coordinates values are based on the centerline of the pipe. The coordinate values for the bends are represented by the intersection of a straight line thru the center of the two adjoining straights of the bend. This point value and the radius value are used to determine the location of the bend.
First you decide the point to start bending and decide the order to take coordinates. Point (2) becomes the point to make as bend #1. Based on selected direction, coordinates are assigned as in the following drawing.
Then you select origin point of coordinate axis and take coordinates in order. We select point (1) as origin point of XYZ axis, then assign values to point (2), (3), and (4) as a distance from point (1). The coordinates listed as follows:
## 2. Tables
| No. |    X     |    Y     |    Z     |
|-----|----------|----------|----------|
| (1) |  0.00    |  0.00    |  0.00    |
| (2) | 130.00   |  0.00    |  0.00    |
| (3) | 130.00   | -270.00  |  0.00    |
| (4) | 330.00   | -270.00  | 200.00   |
## 3. Key Data Points and Values
- Outer Diameter of Pipe: 25.4 mm
- Number of Bends: 2
- Bend Radius: 40 mm
- Coordinates:
  - Point (1): (0.00, 0.00, 0.00)
  - Point (2): (130.00, 0.00, 0.00)
  - Point (3): (130.00, -270.00, 0.00)
  - Point (4): (330.00, -270.00, 200.00)
## 4. Document Structure
- **Header**: Example - making data of pipe with outer diameter 25.4 [mm]
- **Sections**:
  - Input Instructions
  - Coordinate Assignment Instructions
  - Table of Coordinates
## 5. Forms or Structured Data
- The table provided is structured data representing the coordinates of the bends in the pipe.
This structured output preserves the original formatting and clearly delineates the various components of the document.
--- Page 28 (Azure OpenAI Vision) ---
# Document Extraction and Structuring
## 1. Text Content
Since bend radius is 40 [mm], we input step position which matches the tool setup of [R1], [R2], [R3] bend die in working specification screen.
- R1 (lower radius) •••1
- R2 (middle radius) •••2
- R3 (top radius) •••3
The step position assignments of the end points of tube do not affect the bend. They affect the rest of the program as follows:
- The step position of point 1 becomes pipe supply step position after the calculation.
- The step position of point 4 is not used.
After completion of all input, push [calculation] button to calculate FPB data.
### WHEN BEND PROCESS IS NOT MADE AT BENDER AND IS FORMED AS SECONDARY PROCESS
If part includes special bend process which cannot be bent with bender, you can make program omitting the one process. The control will calculate the necessary configuration to add the bend later for the exact form desired.
Take XYZ coordinates as usual. Set [point.jump R] ON for the coordinates of bend to be skipped, input the bend radius of the point and calculate FPB data. Then FPB data will be calculated leaving the correct length and rotation position to add the bend later in the correct location.
**Note:** As for the [number of bends] of working specification screen, exclude the bend that is to be skipped. You must input the correct number of bends with this bender. Otherwise FPB data is not calculated correctly.
### WHEN PIPE IS BENT BY 180°
The coordinate values for the bends are represented by the intersection of a straight line thru the center of the two adjoining straights of the bend. However, in case of 180° bend, the straight lines are parallel and do not intersect. It is not possible to take coordinates.
## 2. Tables
| Radius Type      | Value |
|------------------|-------|
| R1 (lower radius)| •••1  |
| R2 (middle radius)| •••2  |
| R3 (top radius)  | •••3  |
## 3. Key Data Points and Values
- Bend Radius: 40 mm
- Step Position Assignments:
  - Point 1: Pipe supply step position after calculation
  - Point 4: Not used
- Note on Bends: Exclude the bend that is to be skipped for FPB data calculation.
## 4. Document Structure
- **Title:** Bend Process Instructions
- **Sections:**
  - Bend Radius Input
  - Step Position Assignments
  - Calculation Instructions
  - Secondary Process Instructions
  - Note on Bends
  - 180° Bend Instructions
## 5. Forms or Structured Data
- Input Fields:
  - Bend Radius: [Input Field]
  - Step Position: [Input Field]
  - XYZ Coordinates: [Input Field]
  - Number of Bends: [Input Field]
  
- Buttons:
  - [Calculation]
This structured format preserves the original content while organizing it for clarity and ease of understanding.
--- Page 29 (Azure OpenAI Vision) ---
# Extracted Information
## 1. Text Content
In order to obtain point to take coordinates, 180° bend is treated as two adjoining 90° bends and tangent is added to cross the parallel lines of front and rear straights at right angle. We get 2 coordinates of cross point and input it as coordinate point.
As for number of bends, input 2 in case of this example. Although we have added coordinates to make 90° bend twice, we actually make 180° bend as one process. Note that although number of coordinates increase, number of bends remains unchanged.
When orientation of XYZ axis is determined above, and (1) is assigned as origin point of XYZ, coordinates of each point as follows.
Since number of bends is set at 2, XYZ coordinates will be recognized only to point (2) and calculated, therefore FPB data will be incorrect. In order to let the calculating computer know that coordinates are input in excess due to 180° bend, set the 180° bend [ON] for the start coordinate of the two coordinates and calculates FPB data. In case of above drawing, set point (3) [ON].
Please note that you cannot set [point jump R] flag and [180° bend] flag at the following point of [180° bend] flag. You cannot set [180° bend] flag prior to [point jump R] flag.
## 2. Tables
| No. |   X    |    Y    |   Z    |
|-----|--------|---------|--------|
| (1) |  0.00  |  0.00   |  0.00  |
| (2) | 130.00 |  0.00   |  0.00  |
| (3) | 130.00 | -270.00 |  0.00  |
| (4) | 21.00  | -270.00 |  0.00  |
| (5) | 21.00  |  12.70  |  0.00  |
## 3. Key Data Points and Values
- **Bend Types**: 
  - 180° bend treated as two 90° bends.
- **Coordinates**:
  - Point (1): (0.00, 0.00, 0.00)
  - Point (2): (130.00, 0.00, 0.00)
  - Point (3): (130.00, -270.00, 0.00)
  - Point (4): (21.00, -270.00, 0.00)
  - Point (5): (21.00, 12.70, 0.00)
- **Flags**:
  - Set 180° bend [ON] for calculations.
  - Cannot set [point jump R] flag and [180° bend] flag simultaneously.
## 4. Document Structure
- **Introduction**: Explanation of how to obtain coordinates for bends.
- **Bend Input Example**: Description of inputting bends and coordinates.
- **XYZ Coordinates Table**: Presentation of coordinates for points.
- **Instructions**: Guidelines on setting flags for calculations.
## 5. Forms or Structured Data
- The table provided with coordinates can be considered structured data, detailing the X, Y, and Z values for specific points.
--- Page 30 (Azure OpenAI Vision) ---
# Extracted Information from Document
## 1. Text Content
**SETTING OF FPB**  
Settings of detailed motion for each process are done here, such as setting of movement amount and angle of Feed (length or Y movement), Plane (rotation or B movement) and Bend (angle or C movement), interruption motion, before bend sequence, after bend sequence etc. Data will be stored when SAVE button is pushed or screen is changed. FPB can be created up to max. 60 processes.
### FPB - SCREEN ITEMS
Setting of pipe length, start length, end length, and number of bends.
**EXTENDED PIPE LENGTH**  
Reference value which stands for theoretical pipe length without consideration of elongation or adjusted length. It is calculated from XYZ 3-D coordinates. It is not necessary to input when working file is made directly from FPB.
**PIPE TOTAL LENGTH**  
Input actual pipe length used for the bend process.  
When FPB is calculated from XYZ 3-D coordinates, bend start position is calculated based upon the extended pipe length. However actual pipe length may be different than extended pipe length, because elongation of pipe occurs or a length that is different than the calculated length is used. When pipe total length is input, bend start position will be recalculated as pipe total length - bend start length.
**BEND START LENGTH**  
The length of straight pipe from front end of pipe to first bend tangent; calculated from XYZ 3-D coordinate or input manually.
**LAST LENGTH**  
The length of straight pipe from last bend to rear end of pipe; calculated from XYZ 3-D coordinate or input manually.
**NUMBER OF BENDS**  
Number of bends is used when XYZ 3-D coordinates are calculated into FPB data and to decide number of processes to move. This is not the same as number of coordinates due to end points and settings for [point jump R] or [180° bend]. Input the number of bends that will be formed with this bender. This is same item as [number of bends] in FPB screen and XYZ screen.
### FPB - SUPPLY CONDITION TAB
**PIPE SUPPLY POSITION**  
Feed position of chuck table for loading of pipe.  
Input feed position and speed of feed when it moves to pipe supply position. This is same item as [pipe supply position] in the working specification screen.
**BEND START POSITION (FEED)**  
Feed position of chuck table for the position of the first bend process.  
When FPB data is created from coordinates, it is calculated and input. A set value at the right of + inputs the amount of correction. Feed moves to the position of bend start position + corrective amount. Input feed position and speed of feed when it moves from pipe supply position to bend start position.
## 2. Tables
| **Item**                     | **Description**                                                                                       |
|------------------------------|-------------------------------------------------------------------------------------------------------|
| EXTENDED PIPE LENGTH         | Reference value for theoretical pipe length without elongation.                                      |
| PIPE TOTAL LENGTH            | Actual pipe length used for the bend process.                                                        |
| BEND START LENGTH            | Length of straight pipe from front end to first bend tangent.                                        |
| LAST LENGTH                  | Length of straight pipe from last bend to rear end of pipe.                                          |
| NUMBER OF BENDS              | Number of bends calculated from XYZ 3-D coordinates.                                                |
| PIPE SUPPLY POSITION          | Feed position of chuck table for loading of pipe.                                                   |
| BEND START POSITION (FEED)   | Feed position of chuck table for the first bend process.                                            |
## 3. Key Data Points and Values
- Maximum number of processes: **60**
- Extended Pipe Length: Calculated from XYZ 3-D coordinates.
- Pipe Total Length: Input actual pipe length.
- Bend Start Length: Calculated from XYZ 3-D coordinates or input manually.
- Last Length: Calculated from XYZ 3-D coordinates or input manually.
- Number of Bends: Input the number of bends formed with the bender.
## 4. Document Structure
- **Header**: SETTING OF FPB
- **Sections**:
  - FPB - SCREEN ITEMS
  - FPB - SUPPLY CONDITION TAB
## 5. Forms or Structured Data
- No specific forms were identified in the provided content. The data is structured in a descriptive format rather than a form-based format.
--- Page 31 (Azure OpenAI Vision) ---
# Extracted Information from Document Page
## 1. Text Content
### BEND START POSITION (PLANE)
Plane position at the time of first bend process. This setting determines any rotation needed from pipe supply position to bend start position.  
If plane motion is needed set to ON and set position and direction of rotation (normal or [REVERSE]).  
You can use present position copy function for the input of [pipe supply position] and [bend start position (feed and plane)].
### STEP POSITION
You set step position (radius) of chuck table at the pipe supply position.  
In most cases, this is same setting as step position of first process. The setting is changed if feeder is installed, and pipes can be supplied only at specified step position.
### CROSS MOVEMENT
Sets pipe supply position in the cross-move position (loading in cross-move).
### PIPE SUPPLY MANDREL POSITION
Position of mandrel at the pipe supply position (advance side or retract side).
### BEND START POSITION MOVEMENT
#### ADVANCE SIDE
Changes as follows. Feed moves from pipe supply position to bend start position after cross movement of chuck table, then returns cross movement after completion of feed motion.
#### RETRACT SIDE
Feed moves from pipe supply position to bend start position after retract of cross movement.
### AFTER PRESSURE MID CLOSE
Feed moves from pipe supply position to bend start position after pressure moves to mid-position.
### BEND ORIGINAL POINT POSITION
Input position of bend at pipe supply position.  
In most cases, initial value of 0° is used. Set when bend position 0° causes problems for pipe supply. At the first process, bend starts from this position.
### PLANE ROTATION FOR LOADING
Set when plane position at time of pipe supply needs to be other than 0°. Change to ON and input position needed for loading.  
In most cases, initial value of 0° is used. Set when plane position 0° causes problems for pipe supply. If you set to OFF, plane does not move.
### PFb - MOTION SETTING TAB
#### BEND METHOD
Reference page 16 for bend method. This is same setting as in working specification screen.
### END PROCESS
You can select how to remove part and set for next part after last bend motion.
#### END PROCESS 1
After last bend motion, bender stops with clamp, pressure, chuck closed (chuck remains open if open bend or stopper bend). If you push [material removal] button of operator pedestal, clamp, pressure, chuck open and pressure boost retracts, then part can be removed from bender (step on safety mat allowed).  
Then push [original point] button to move to pipe supply position of next cycle (must be off safety mat).
## 2. Tables
No tables were present in the document.
## 3. Key Data Points and Values
- **Bend Start Position (Plane)**: Determines rotation needed from pipe supply position to bend start position.
- **Step Position**: Radius of chuck table at pipe supply position.
- **Cross Movement**: Sets pipe supply position in cross-move position.
- **Pipe Supply Mandrel Position**: Position of mandrel at pipe supply position (advance or retract side).
- **Bend Original Point Position**: Initial value of 0° is used for bend position.
- **Plane Rotation for Loading**: Needs to be set when plane position is not 0°.
## 4. Document Structure
- **Section 1**: Bend Start Position (Plane)
- **Section 2**: Step Position
- **Section 3**: Cross Movement
- **Section 4**: Pipe Supply Mandrel Position
- **Section 5**: Bend Start Position Movement
  - Advance Side
  - Retract Side
- **Section 6**: After Pressure Mid Close
- **Section 7**: Bend Original Point Position
- **Section 8**: Plane Rotation for Loading
- **Section 9**: PFb - Motion Setting Tab
- **Section 10**: Bend Method
- **Section 11**: End Process
  - End Process 1
## 5. Forms or Structured Data
No forms or structured data were present in the document.
--- Page 32 (Azure OpenAI Vision) ---
# Extracted Information from Document
## 1. Text Content
### END PROCESS 2
After last bend motion, clamp, pressure, and chuck opens, pressure boost retracts and stops, then part can be removed from bender (step on safety mat allowed).  
Then push [original point] button to move to pipe supply position of next cycle (must be off safety mat).
### END PROCESS 3
After last bend motion, bender operates automatically until pipe supply position of next cycle (must be off safety mat).
### END PROCESS 4
After last bend motion, only pressure opens and pressure boost stops after retract.  
When [material removal] button of handy operation panel is pushed, clamp and chuck opens, then part can be removed from bender (step on safety mat allowed). After that, push [original point] button to move to pipe supply position of next cycle (must be off safety mat).
### END PROCESS 5
After last bend motion, pressure opens, after pressure boost retract, bend moves to original point position while gripping pipe with clamp.  
When [material removal] button of handy operation panel is pushed, clamp and chuck open, then part can be removed from bender (step on safety mat allowed). After that, push [original point] button to move to pipe supply position of next cycle (must be off safety mat).
### LAST BEND MOTION
Determines the movement of bender for process of the last bend as follows below.
#### OPEN BEND
When positioned for last bend, the chuck opens and releases pipe, feed retracts the value on the last process line, and bend is performed.
#### CLOSE BEND 1
When positioned for last bend, the chuck stays closed. After bend motion, feed and plane motions are done in accordance with data of last process. Bend will likewise return to zero prior to discharge of part.
#### CLOSE BEND 2
When positioned for last bend, the chuck stays closed. After bend motion, feed and plane motions are done in accordance with data of last process. Bend will remain at position of data of last process (will NOT return to zero) prior to discharge of part.
#### STOPPER BEND
(if the STOPPER option is installed – standard on feed boost benders)  
When positioned for last bend, the chuck opens and releases pipe, feed retracts the value on the last process line. At the same time the stopper (tube stop) advances to stay in contact with the rear of the pipe. Since pipe is supported by stopper, it is possible to add pressure of feed follow or feed boost to rear of tube for the last process.
### REPEAT BENDING
Repeat bending | a | Process | b | Process | c | Times  
This sets the program to repeat one or multiple lines of the program multiple times. It operates from [a] process to [b] process, after finish of [b] process returns to [a] process, and operates up to [b] process again. This operation will be repeated [c] times and, after completion of final [b] process, it will move to the motion of [b + 1] process.  
Example:  
Repeat bending | 2 | Process | 4 | Process | 2 | Times
## 2. Tables
| Repeat bending | a | Process | b | Process | c | Times |
|----------------|---|---------|---|---------|---|-------|
|                | 2 | Process | 4 | Process | 2 | Times |
## 3. Key Data Points and Values
- **END PROCESS 2**: Requires safety mat to be off for moving to next cycle.
- **END PROCESS 3**: Automatic operation until next cycle.
- **END PROCESS 4**: Requires safety mat to be off for moving to next cycle.
- **END PROCESS 5**: Requires safety mat to be off for moving to next cycle.
- **OPEN BEND**: Chuck opens and releases pipe.
- **CLOSE BEND 1**: Chuck stays closed; returns to zero prior to discharge.
- **CLOSE BEND 2**: Chuck stays closed; does not return to zero.
- **STOPPER BEND**: Chuck opens and releases pipe; supports pipe with stopper.
- **Repeat Bending**: Can repeat processes multiple times.
## 4. Document Structure
- **Headers**: 
  - END PROCESS 2
  - END PROCESS 3
  - END PROCESS 4
  - END PROCESS 5
  - LAST BEND MOTION
  - REPEAT BENDING
- **Sections**: 
  - Each END PROCESS is a separate section.
  - LAST BEND MOTION has subsections (OPEN BEND, CLOSE BEND 1, CLOSE BEND 2, STOPPER BEND).
  - REPEAT BENDING is a separate section with a table.
## 5. Forms or Structured Data
- The table under "REPEAT BENDING" serves as structured data for program repetition settings.
--- Page 33 (Azure OpenAI Vision) ---
# Document Information Extraction
## 1. Text Content
Using this setting for a program with 6 processes will create the flow of motion shown:
The process lines set for repeat bend will be displayed in red.
### PFB - EACH PROCESS DETAILS 1 TAB
Settings that can be selected for each process line. The process number being edited will be displayed in the lower right corner of the tab.
**CROSS MOVEMENT**  
During bend return (after bend) chuck table advances to cross-move position while feed moves to next bend process point. Chuck table returns after feed motion finish.
**PRIOR CROSS MOVEMENT**  
Cross movement of chuck table advances before feed moves to next bend process point.
**R CLAMP**  
When mandrel device is installed, normally mandrel advances before clamp and pressure close. However, if bend process is done by using R clamp, mandrel advances after clamp close.
**NORMAL BEND**  
When you use bender of KBB series, you can set bend motion of the process for normal bend without using feed follow boost. Benders without this function will not display this setting.
**ONCE STOP**  
Automatic operation stops temporarily at designated place and auto start button of operation panel flashes. Push auto start button of operation panel or push dual auto start buttons of operator pedestal to re-start automatic operation. The timing to make once stop is shown below.
**BEFORE BEND**  
Motion stops temporarily before clamp and pressure are closed.
**AFTER BEND 1**  
Motion stops temporarily after bend motion is complete and before clamp is open.
**AFTER BEND 2**  
Motion stops temporarily after bend motion is complete and after clamp is open.
**CROSS MOVEMENT**  
Motion stops temporarily after bend return and before cross movement retract (when cross-move is used between processes), and after positioning feed and plane for next process.
## 2. Tables
No tables were present in the document.
## 3. Key Data Points and Values
- **Process Count**: 6 processes
- **Settings**:
  - Cross Movement
  - Prior Cross Movement
  - R Clamp
  - Normal Bend
  - Once Stop
- **Motion Stop Points**:
  - Before Bend
  - After Bend 1
  - After Bend 2
  - Cross Movement
## 4. Document Structure
- **Header**: PFB - EACH PROCESS DETAILS 1 TAB
- **Sections**:
  - Cross Movement
  - Prior Cross Movement
  - R Clamp
  - Normal Bend
  - Once Stop
    - Before Bend
    - After Bend 1
    - After Bend 2
    - Cross Movement
## 5. Forms or Structured Data
No forms or structured data were present in the document.
--- Page 34 (Azure OpenAI Vision) ---
# Extracted Information
## 1. All Text Content
### MANDREL PRIOR RETRACT
Item is set to enable mandrel retract before the end of bend motion. Setting is used for tight radius and thin wall tubing to prevent balls of mandrel from marking the tube. Mandrel starts to retract during bend motion when angle equals the set value. When mandrel off function is OFF, it is not displayed.
### SPLIT DIE
Item is set when bending requires bend split die construction, and if you want to open split die after bend motion. Split die will open after bend and after clamp and pressure dies are open. Split die will close before the close of clamp and pressure of next process. Benders without this function will not display this setting.
### ONCE FORWARD
Item is set to allow feed temporary advance after bend and after dies open. Feed advances by remaining feed amount after bend arm has returned.
### SEGMENT BEND
Item is set to split bend movement in segments to cycle mandrel aft and forward. The segment bend is used when multiple mandrel movements are necessary during a bend movement for part form of pipe outer wall.
### BEND SEVERAL TIMES
Single bend can be divided into as many as 9 movements. Between each bend movement, it opens pressure and, after returning pressure boost (or spring return of pressure slide), it closes pressure again. This is used for shorter pressure die length.
### FFB - EACH PROCESS DETAILS 2 TAB
Settings that can be selected for each process line. The process number being edited will be displayed in lower right corner of tab.
### TEMPORARY ADVANCE MOTION
Item is set to add a temporary advance to the feed movement. When it feeds up to bend process point of next process, it feeds the process line value and the advance amount value, and after completion of plane motion, it will retract for the advance amount value.
### CHUCK RE-GRIP MOTION
Item is set to add a chuck re-grip to the process line. After close of clamp and pressure, chuck opens to release pipe, then feed moves the retract value, then chuck closes again before the bend motion.
### PLANE MOTION AFTER BEND RETURN
Timing of plane motion is changed. When it moves to bend process point of next process, plane motion will start after finish of bend return motion.
### BEND BACK PROHIBITION MOTION
Item is set to prevent bend arm return after the bend. This can be used to prevent interference of pipe and bender during movement after bend. Value is set to hold bend arm in position or move to secondary position after bend motion is complete. After bend and after movement of feed and plane, bend moves to [bend prohibition amount] position. Then, after radius change (in case of no radius change, after bend), if setting of bend back prohibition in process is ON, it moves to next process without bend return. If it is OFF, moves to next process after bend return. If setting of bend back prohibition in process is ON, a "dummy" process line can be used to return the bend arm after the set process is complete.
### BEFORE BEND SEQUENCE
Item is set when editing sequence is to be used before bend. Push EDIT button to change to before bend sequence editing screen of the process line. Select TEACHING before sequence is to be created using the TEACH function in AUTO mode. Select ON if the sequence is created manually. Changes from TEACHING to ON immediately after the AUTO mode teaching is completed.
---
## 2. Any Tables
*No tables were present in the provided document content.*
---
## 3. Key Data Points and Values
- **Mandrel Prior Retract**: Enables mandrel retract before end of bend motion.
- **Split Die**: Opens after bend and after clamp and pressure dies are open.
- **Once Forward**: Allows temporary advance after bend.
- **Segment Bend**: Splits bend movement into segments.
- **Bend Several Times**: Allows up to 9 movements between bends.
- **Temporary Advance Motion**: Adds temporary advance to feed movement.
- **Chuck Re-Grip Motion**: Adds a chuck re-grip to the process line.
- **Plane Motion After Bend Return**: Changes timing of plane motion.
- **Bend Back Prohibition Motion**: Prevents bend arm return after the bend.
- **Before Bend Sequence**: Editing sequence for before bend.
---
## 4. Document Structure
- **Headers/Sections**:
  - MANDREL PRIOR RETRACT
  - SPLIT DIE
  - ONCE FORWARD
  - SEGMENT BEND
  - BEND SEVERAL TIMES
  - FFB - EACH PROCESS DETAILS 2 TAB
  - TEMPORARY ADVANCE MOTION
  - CHUCK RE-GRIP MOTION
  - PLANE MOTION AFTER BEND RETURN
  - BEND BACK PROHIBITION MOTION
  - BEFORE BEND SEQUENCE
---
## 5. Any Forms or Structured Data
*No forms or structured data were present in the provided document content.*
--- Page 35 (Azure OpenAI Vision) ---
# Document Extraction and Structuring
## 1. Text Content
### AFTER BEND SEQUENCE
Item is set when editing sequence is to be used after bend. Push EDIT button to change to after bend sequence editing screen of the process line. Select TEACHING before sequence is to be created using the TEACH function in AUTO mode. Select ON if the sequence is created manually. Change from TEACHING to ON immediately after the AUTO mode teaching is completed.
### CHUCK RECAPTURING MOTION
Item is set to command chuck to release part, retreat from pressure interference zone before bend, and recapture inside pressure interference zone after bend. When positioned for next bend, clamp will close to hold pipe, chuck will open, feed will move the retract amount, and then dies will close for the bend. After completion of bend motion, pressure opens, feed moves the advance amount, and chuck closes to re-grip pipe before next process.
### BEND CORRECTIVE AMOUNT RETURN
Just after the bend motion, you can return bend arm by bend corrective amount portion. When pressure open is not set, it bends back by the bend corrective amount portion without opening pressure. When pressure open is set, it bends back by bend corrective amount portion, after pressure is open. Then clamp and pressure will open and cycle will continue to next process.
## 2. Tables
### PF8 - CORRECTIVE TAB
| **BEND CORRECTION** | Sets the bend corrective amount for all processes in accordance with the selected corrective value data. |
|----------------------|----------------------------------------------------------------------------------------------------------|
| **UNIT SETTING**     | When setting bend corrective amount, select input value for bend amount in percent of bend value [%] or absolute value [°]. |
| **CORRECTIVE MODE VALUE** | Setting of reference value for bend corrective amount used to calculate batch input for all processes. In case of corrective mode [%], batch input is done as percent of bend value (corrective mode value [%]). In case of corrective mode [°], the same corrective mode value is set for all processes. If you push [execute] button, batch input is completed. |
| **CORRECTIVE FILE**  | Corrective file screen is displayed. Sets values to create graph of relation between process bend angle and corrective value amount, and then inputs corrective values for the other process bend angles intersecting the graph. Values for spring-back of multiple angles will calculate more accurate corrective values for all process angles. |
### CREATE NEW CORRECTIVE FILE
| **File name** |
|---------------|
| test01        |
## 3. Key Data Points and Values
- **Bend Corrective Amount**: Amount set for all processes based on corrective value data.
- **Unit Setting**: Input value for bend amount can be in percent [%] or absolute value [°].
- **Corrective Mode Value**: Reference value for calculating batch input.
- **Corrective File**: Graph of relation between process bend angle and corrective value amount.
## 4. Document Structure
- **Headers**:
  - AFTER BEND SEQUENCE
  - CHUCK RECAPTURING MOTION
  - BEND CORRECTIVE AMOUNT RETURN
  - PF8 - CORRECTIVE TAB
  - CREATE NEW CORRECTIVE FILE
- **Sections**:
  - Each header introduces a new section with specific instructions or information.
## 5. Forms or Structured Data
- **Create New Corrective File Form**:
  - Instructions to input corrective amounts in accordance with bend angles.
This structured output preserves the content and formatting of the original document while organizing the information for clarity.
--- Page 36 (Azure OpenAI Vision) ---
# Extracted Information
## 1. Text Content
### Edit Corrective File
- Select corrective file to be edited and make necessary changes. File name can also be edited. After editing, push [execute] button to save changes. Push [Reflect] to apply changes to all bend corrective amounts of part program.
### Reflection to Bend Corrective Amount from Corrective File
- Select corrective file to be reflected and push [reflect] to apply changes to all bend corrective amounts of part program. (Previous bend corrective amounts of program are replaced with new reflected amount.)
- Corrective file can be created up to 10 pieces.
- Note: Corrective file is used to apply changes to multiple programs using same material and tooling.
### Initial Reset
- Previous bend corrective amounts of program are reset to zero.
### Plane Reverse Turn
- It converts the plane value to the opposite direction (i.e. +90° is converted to -270°).
- It changes the direction of rotation to normal turn or reverse turn but the position of rotation does not change. Calculate with execute button.
### Speed Package Change
- The speed of axis movement can be converted for all process lines. Convert with execute button.
### Insert
- You can insert new process above the selected process line. Since number of process increases, number of bends also increases automatically. Press [execute] to insert process line.
### Delete
- You can delete selected process line. Since number of process decreases, number of bends also decrease. Press [execute] to delete process line.
## 2. Tables
### FPB - Process Line Items
|   | 1 Speed | 2 Corrective amount | 3 Speed | 4 Plane amount | 5 Corrective amount | 6 Speed | 7 Bend amount | 8 Corrective amount | 9 R | 10 PP | PF | Aro length |
|---|---------|---------------------|---------|----------------|---------------------|---------|---------------|---------------------|---|---|---|------------|
| 1 | 10.00   | 5                   | 5       | 180.00         | 0.00                | 5       | 30.00         | 0.00                | 0 | 1 | 0 | 20.94      |
| 2 | 20.00   | 5                   | 5       | 180.00         | 0.00                | 5       | 45.00         | 0.00                | 0 | 1 | 0 | 31.42      |
| 3 | 10.00   | 5                   | 5       | 180.00         | 0.00                | 5       | 60.00         | 0.00                | 0 | 1 | 0 | 41.89      |
| 4 | 10.00   | 5                   | 5       | 180.00         | 0.00                | 5       | 60.00         | 0.00                | 0 | 1 | 0 | 62.83      |
| 5 | 5.00    | 5                   | 5       | 0.00           | 0.00                | 5       | 60.00         | 0.00                | 0 | 1 | 0 | 41.89      |
| 6 | 5.00    | 5                   | 5       | 0.00           | 0.00                | 5       | 0.00          | 0.00                | 0 | 1 | 0 | 0.00       |
## 3. Key Data Points and Values
- **Corrective File Creation**: Up to 10 pieces
- **Initial Reset**: Resets previous bend corrective amounts to zero
- **Plane Reverse Turn**: Converts +90° to -270°
- **Speed Package Change**: Converts speed of axis movement for all process lines
- **Process Line Numbers**: Indicated in the table under "Process No."
- **Speed (Feed)**: Input speed of feed can be set in 5 steps (Low speed to High speed)
## 4. Document Structure
- **Headers**: 
  - Edit Corrective File
  - Reflection to Bend Corrective Amount from Corrective File
  - Initial Reset
  - Plane Reverse Turn
  - Speed Package Change
  - Insert
  - Delete
- **Sections**: Each header represents a section with specific instructions or information.
## 5. Forms or Structured Data
- **Process Line Number**: Identified in the table as "Process No."
- **Speed (Feed)**: Input speed of feed is structured as a range from low to high speed with 5 steps.
--- Page 37 (Azure OpenAI Vision) ---
# Extracted Information from Document Page
## 1. Text Content
- **FEED AMOUNT**
  - Input movement amount of feed.
  - + advance, - retract motion.
  
- **CORRECTIVE AMOUNT (FEED)**
  - Input corrective amount of feed.
  - Feed amount ± corrective amount (feed) = movement amount of feed.
  
- **SPEED (PLANE)**
  - Input speed of plane.
  - Low speed 1 2 3 4 5 High speed
  - You can set 5 steps.
  
- **PLANE AMOUNT**
  - Input angle of plane.
  - + is normal turn (left turn viewed from front) - is reverse turn.
  
- **CORRECTIVE AMOUNT (PLANE)**
  - Input corrective amount of plane angle.
  - Plane amount ± corrective amount (plane) = plane angle.
  
- **SPEED (BEND)**
  - Input bend speed.
  - Low speed 1 2 3 4 5 High speed
  - You can set 5 steps.
  
- **BEND AMOUNT**
  - Input bend angle.
  - + is bend direction, - is return direction.
  
- **CORRECTIVE AMOUNT (BEND)**
  - Input corrective amount of bend angle.
  - Bend amount ± corrective amount (bend) = bend angle.
  
- **R**
  - You can designate step position. R1 = bottom (or single radius) R2 = middle (top for dual radius) R3 = top (triple radius).
  
- **PF**
  - It designates pressure data No. of pressure boost force. Benders without this function will not display this setting.
  
- **PF**
  - It designates thrust data No. of feed follow thrust. Benders without this function will not display this setting.
  
- **ARC LENGTH**
  - Arc length of theoretical value is displayed.
## 2. Tables
| **Parameter**                | **Description**                                           |
|------------------------------|-----------------------------------------------------------|
| FEED AMOUNT                  | Input movement amount of feed.                            |
| CORRECTIVE AMOUNT (FEED)     | Input corrective amount of feed.                          |
| SPEED (PLANE)                | Input speed of plane.                                     |
| PLANE AMOUNT                 | Input angle of plane.                                     |
| CORRECTIVE AMOUNT (PLANE)    | Input corrective amount of plane angle.                   |
| SPEED (BEND)                 | Input bend speed.                                        |
| BEND AMOUNT                  | Input bend angle.                                        |
| CORRECTIVE AMOUNT (BEND)     | Input corrective amount of bend angle.                   |
| R                            | Designate step position.                                  |
| PF                           | Designates pressure data No. of pressure boost force.    |
| PF                           | Designates thrust data No. of feed follow thrust.        |
| ARC LENGTH                   | Arc length of theoretical value is displayed.            |
## 3. Key Data Points and Values
- Speed settings: 1 (Low speed) to 5 (High speed)
- R1 = bottom, R2 = middle, R3 = top
- ARC LENGTH: Theoretical value displayed.
## 4. Document Structure
- **Sections:**
  - Feed Amount
  - Corrective Amount (Feed)
  - Speed (Plane)
  - Plane Amount
  - Corrective Amount (Plane)
  - Speed (Bend)
  - Bend Amount
  - Corrective Amount (Bend)
  - R
  - PF (Pressure Data)
  - PF (Thrust Data)
  - ARC LENGTH
## 5. Forms or Structured Data
- No specific forms were identified in the document. The data is presented in a structured textual format without interactive forms.
--- Page 38 (Azure OpenAI Vision) ---
# Extracted Information from Document
## 1. Text Content
### SETTING OF FUNCTION
**function**  
Push this icon to change to function screen.  
Selection of optional devices, setting of special motion, or selection of subprogram to run is chosen here.  
Data will be stored when SAVE button is pushed or screen is changed.
### FUNCTION - MOTION SELECTION TAB
#### SQUARE PIPE
When square pipe is processed, the plane motion must be done with chuck table in the advance side, otherwise it is trapped by square groove of bend die. Therefore the motion will be changed as follows. Before the plane motion, cross movement of chuck table advances; after completion of plane motion, cross movement returns.
#### VARIABLE ELONGATION CORRECTION
Many materials will stretch or “elongate” during the bend process. (The elongated portion affects rear part of pipe, this causing uneven last length). Basing upon the set elongation rate, machine will adjust feed amount by adding the elongation of pipe when bend process is done, making last length even.  
Since pipe elongation remains unchanged, if last length is kept even, it causes uneven length of straights between bent points in center of part.
When feed amount of each process is F1, feed corrective amount of each process is F2, bend radius is R, bend angle is θ (bend amount + bend corrective amount) elongation ratio is α, the actually moved amount of chuck table at the time of bend is F3, the feed amount after bending becomes.
\\[ F1 + F2 = \\frac{{θ}}{{360}} \\times 2 \\pi R \\times \\frac{{100 - α}}{{100}} - F3 \\]
#### PRESSURE PRIOR CLOSE
After movement to bend process point, in normal operation, clamp and pressure close at the same time. This setting commands pressure to close first, then clamp close.
#### PRESSURE END HOLD RELEASE
In normal case, output of pressure close stays ON after finish of pressure close. But in this case the output will go OFF.
#### MANDREL
Enables the cycling of mandrel. Mandrel will insert prior to clamp close, and extract after bend motion is complete.
#### BALL MANDREL
Enables the “small open” function of pressure die when using multiple ball mandrel for tight radius / thin wall tubing. If ball mandrel retracts while pressure is closed, a complex mandrel may be trapped by the tension of the pressure die. Setting this function will open pressure for [pressure slight open timer] value, retract ball mandrel, then continue with process.  
When you use this function, the MANDREL setting must also be ON.
---
## 2. Tables
### Variable Elongation Correction Formula
| Variable | Description |
|----------|-------------|
| F1       | Feed amount of each process |
| F2       | Feed corrective amount of each process |
| F3       | Feed amount after bending |
| R        | Bend radius |
| θ        | Bend angle |
| α        | Elongation ratio |
### Formula
\\[ F1 + F2 = \\frac{{θ}}{{360}} \\times 2 \\pi R \\times \\frac{{100 - α}}{{100}} - F3 \\]
---
## 3. Key Data Points and Values
- **Bend Radius (R)**: Variable
- **Bend Angle (θ)**: Variable
- **Elongation Ratio (α)**: Variable
- **Feed Amounts**: F1, F2, F3 (variables)
---
## 4. Document Structure
- **Header**: SETTING OF FUNCTION
- **Subheader**: FUNCTION - MOTION SELECTION TAB
  - **Section**: SQUARE PIPE
  - **Section**: VARIABLE ELONGATION CORRECTION
  - **Section**: PRESSURE PRIOR CLOSE
  - **Section**: PRESSURE END HOLD RELEASE
  - **Section**: MANDREL
  - **Section**: BALL MANDREL
---
## 5. Forms or Structured Data
- No explicit forms or structured data were identified in the document. The information is primarily descriptive and formulaic.
--- Page 39 (Azure OpenAI Vision) ---
# Extracted Information from Document Page
## 1. Text Content
**MANDREL MIDDLE RETRACT**  
Allows use of mandrel mid-position. After completion of bend motion, when mandrel retracts, it retracts for [mandrel middle retract time] value only.  
When mandrel makes standard retract motion, the calculation of mandrel interference position changes. Normally, when mandrel retracts, if the following conditions occur:
**Chuck** | **Interference position**  
--- | ---  
Opened | Feed present position ≤ M interference position  
Closed | Feed present position - re-grip retract amount portion (parameter) ≤ M interference position
The mandrel interference 1 alarm is output and process stops. But if mandrel middle retract is used the conditions change:
**Chuck** | **Interference position**  
--- | ---  
Opened | Feed present position ≤ M interference position - mandrel middle retract amount (parameter)  
Closed | Feed present position - re-grip retract portion (parameter) ≤ M interference position - mandrel middle retract amount
The calculation of mandrel interference takes into account the mid-position of mandrel.  
When you use this function, the MANDREL setting must also be ON.
**Note:** When hydraulic motion is stopped with timer, actual mandrel middle retract amount varies. Because of this, mandrel middle retract amount of parameter is set with enough excess to account for the variation of position.
## FUNCTION - OPTION TAB
**MANDREL OIL SUPPLY AT THE TIME OF RETRACTION**  
When mandrel automatic oil supply device is installed, oil supply to mandrel will be done automatically for the set timer portion during the movement to the bend position (while mandrel is retracted).
**MANDREL OIL SUPPLY EACH PROCESS**  
When mandrel automatic oil supply device is installed, oil supply to mandrel will be done automatically for the set timer portion after mandrel is extended and at the command to close clamp and pressure for each process.  
Please use YD01 for output of mandrel oil supply.
**INSERT CHECK**  
If insert check device is installed, when pipe is loaded into chuck, sensor will check for presence of pipe.  
Use X079 for the input of insert check.  
Alarm will also be displayed if insert check sensor is ON before the supply of pipe.
**BEAD DETECTION**  
When bead detection device is installed, bead detection is enabled by setting to ON (subprogram must be added for bead detection of loading device or bead detection used for individual process).
**KICK DISCHARGE**  
When kick device is installed, after completion of last process, the device is commanded to "kick" the part out of chuck.  
Benders of KBB series will ignore settings for kick discharge.
---
## 2. Tables
### Table 1: Mandrel Middle Retract Conditions
**Chuck** | **Interference position**  
--- | ---  
Opened | Feed present position ≤ M interference position  
Closed | Feed present position - re-grip retract amount portion (parameter) ≤ M interference position
### Table 2: Mandrel Middle Retract Conditions (Alternate)
**Chuck** | **Interference position**  
--- | ---  
Opened | Feed present position ≤ M interference position - mandrel middle retract amount (parameter)  
Closed | Feed present position - re-grip retract portion (parameter) ≤ M interference position - mandrel middle retract amount
---
## 3. Key Data Points and Values
- **Mandrel Middle Retract Time**: [mandrel middle retract time] (value not specified)
- **Parameters for Conditions**: 
  - M interference position
  - Mandrel middle retract amount
  - Re-grip retract amount portion
---
## 4. Document Structure
- **Title**: MANDREL MIDDLE RETRACT
- **Sections**:
  - Mandrel Oil Supply at the Time of Retraction
  - Mandrel Oil Supply Each Process
  - Insert Check
  - Bead Detection
  - Kick Discharge
---
## 5. Forms or Structured Data
- **Inputs**:
  - X079: Input of insert check
  - YD01: Output of mandrel oil supply
---
This structured output preserves the original formatting and content while organizing the information for clarity and ease of understanding.
--- Page 40 (Azure OpenAI Vision) ---
# Document Extraction and Structuring
## 1. Text Content
- **MID SUPPORTER**  
  Installed together with supporter to prevent bending or sagging of long pipe between collet and front supporter. If feed exceeds set value of [mid supporter] in the jig information screen, mid supporter moves to escape position.
- **MATERIAL POSITIONING**  
  Used with optional sensors to measure pipe for exact start length. While feed locates in pipe supply position, after calculation of capture point, chuck catches pipe.
- **SUPPLY**  
  It is set when automatic loader is installed. Motion of integrated loader is controlled by subprogram. When loader is controlled by external PLC, it is only necessary to create subprogram for the interface of loader and bender. When this setting is ON, you can start automatic operation without pushing chuck close button of operator pedestal.
- **CHUCK CLOSE POSITION, STANDBY POINT**  
  It is set when command feed motion 9 (FEED 9) of subprogram is used. It is used to control capture and stop point of feed axis when side loader is installed.  
  Before feed moves from pipe supply position to standby point, if present position of feed passes the chuck close position, the chuck begins to close, and feed stops at standby point.  
  Input motion speed of feed when it moves from pipe supply position to chuck close position, from chuck close position to supply complete position, for side speed.
- **LAP SUPPLY**  
  When lap supply is done using supply machine, please set ON. If it is ON, chuck is not forced open at material extract and at movement to home position.  
  If it is not ON, chuck may be forced open at this point of cycle and part already loaded may be dropped.
- **DISCHARGE**  
  When pipe discharge machine is installed, set to ON. Motion of integrated discharge machine is created with subprogram so sequence must exist to control integrated discharge device. When discharge machine is controlled by PLC, it is only necessary to create subprogram for the interface of the discharge machine and the bender.
- **ROBOT**  
  Set to ON if using robot device for loading or unloading. It is necessary to create subprogram to interface with robot. Sequence must exist to control robot.
- **FUNCTION - EDITING SEQUENCE TAB**  
  Selection to make motion of sub-program or not (sub-program 1~21)  
  Setting is necessary to enable sub-program used with each file. Sub-programs are the system sequences used to command optional devices or movements. User will be advised if any are applicable to their machine.
- **File flag 1~10**  
  Selection of program "flag" that can be used in subprogram. Sequence command number 231 "File Flag Branch" checks program for setting of file flag 1~10. It can be used to select optional sequence branch from subprogram used by many programs. User will be advised if any are applicable to their machine.
- **Edit stop point**
## 2. Tables
(No tables were present in the provided text.)
## 3. Key Data Points and Values
- **MID SUPPORTER**: Prevents bending/sagging of long pipe.
- **CHUCK CLOSE POSITION**: Command feed motion 9 (FEED 9).
- **LAP SUPPLY**: ON/OFF setting for chuck operation.
- **DISCHARGE**: ON setting for integrated discharge machine.
- **ROBOT**: ON setting for robot device usage.
- **File flag**: Range from 1 to 10 for subprogram selection.
## 4. Document Structure
- **Headers**: 
  - MID SUPPORTER
  - MATERIAL POSITIONING
  - SUPPLY
  - CHUCK CLOSE POSITION, STANDBY POINT
  - LAP SUPPLY
  - DISCHARGE
  - ROBOT
  - FUNCTION - EDITING SEQUENCE TAB
  - File flag 1~10
  - Edit stop point
## 5. Forms or Structured Data
(No forms or structured data were present in the provided text.)
--- Page 41 (Azure OpenAI Vision) ---
# Extracted Information from Document Page
## 1. Text Content
**SETTING OF PRESSURE/PRESSURE BOOST FORCE-SPEED**  
You can set the force to close pressure, pressure and speed of pressure boost. Each data will be stored when the SAVE button is pushed or screen is changed.
### PRESSURE R1 FORCE
You can set the closing force of pressure, when step position is R1.  
(setting of parameter → machine setting 2 → displayed as check [Yes] of pressure force adjustment from screen)
### PRESSURE R2 FORCE
You can set the closing force of pressure, when step position is R2.  
(setting of parameter → machine setting 2 → displayed as check [Yes] of pressure force adjustment from screen)
### PRESSURE R3 FORCE
You can set the closing force of pressure, when step position is R3.  
(setting of parameter → machine setting 2 → displayed as check [Yes] of pressure force adjustment from screen)
### PRESSURE R4 FORCE
You can set the closing force of pressure, when step position is R4.  
(setting of parameter → machine setting 2 → displayed as check [Yes] of pressure force adjustment from screen)
### PRESSURE R5 FORCE
You can set the closing force of pressure, when step position is R5.  
(setting of parameter → machine setting 2 → displayed as check [Yes] of pressure force adjustment from screen)
### PRESSURE BOOST R1 FORCE
You can set the closing force of pressure boost, when step position is R1.  
(setting of parameter → machine setting 2 → displayed as check [Yes] of pressure boost force adjustment from screen)
### PRESSURE BOOST R2 FORCE
You can set the closing force of pressure boost, when step position is R2.  
(setting of parameter → machine setting 2 → displayed as check [Yes] of pressure boost force adjustment from screen)
### PRESSURE BOOST R3 FORCE
You can set the closing force of pressure boost, when step position is R3.  
(setting of parameter → machine setting 2 → displayed as check [Yes] of pressure boost force adjustment from screen)
### PRESSURE BOOST R4 FORCE
You can set the closing force of pressure boost, when step position is R4.  
(setting of parameter → machine setting 2 → displayed as check [Yes] of pressure boost force adjustment from screen)
### PRESSURE BOOST R5 FORCE
You can set the closing force of pressure boost, when step position is R5.  
(setting of parameter → machine setting 2 → displayed as check [Yes] of pressure boost force adjustment from screen)
### R1 PRESSURE BOOST SPEED RATIO
You can set the speed of pressure boost, when step position is R1. 100 [X] equal to bend speed.  
(setting of parameter → machine setting 1 → pressure boost displayed as each proportional valve selection)
---
## 2. Tables
*No tables were present in the document.*
---
## 3. Key Data Points and Values
- **Pressure R1 Force**: Closing force at step position R1
- **Pressure R2 Force**: Closing force at step position R2
- **Pressure R3 Force**: Closing force at step position R3
- **Pressure R4 Force**: Closing force at step position R4
- **Pressure R5 Force**: Closing force at step position R5
- **Pressure Boost R1 Force**: Closing force of pressure boost at step position R1
- **Pressure Boost R2 Force**: Closing force of pressure boost at step position R2
- **Pressure Boost R3 Force**: Closing force of pressure boost at step position R3
- **Pressure Boost R4 Force**: Closing force of pressure boost at step position R4
- **Pressure Boost R5 Force**: Closing force of pressure boost at step position R5
- **R1 Pressure Boost Speed Ratio**: Speed of pressure boost at step position R1 (100 [X] = bend speed)
---
## 4. Document Structure
- **Header**: SETTING OF PRESSURE/PRESSURE BOOST FORCE-SPEED
- **Sections**:
  - PRESSURE R1 FORCE
  - PRESSURE R2 FORCE
  - PRESSURE R3 FORCE
  - PRESSURE R4 FORCE
  - PRESSURE R5 FORCE
  - PRESSURE BOOST R1 FORCE
  - PRESSURE BOOST R2 FORCE
  - PRESSURE BOOST R3 FORCE
  - PRESSURE BOOST R4 FORCE
  - PRESSURE BOOST R5 FORCE
  - R1 PRESSURE BOOST SPEED RATIO
---
## 5. Forms or Structured Data
*No forms or structured data were present in the document.*
--- Page 42 (Azure OpenAI Vision) ---
# Extracted Information
## 1. All Text Content
### R2 PRESSURE BOOST SPEED RATIO
You can set the speed of pressure boost, when step position is R2. 100 [%] equal to bend speed.  
(setting of parameter → machine setting 1 → pressure boost displayed as each proportional valve selection)
### R3 PRESSURE BOOST SPEED RATIO
You can set the speed of pressure boost, when step position is R3. 100 [%] equal to bend speed.  
(setting of parameter → machine setting 1 → pressure boost displayed as each proportional valve selection)
### R4 PRESSURE BOOST SPEED RATIO
You can set the speed of pressure boost, when step position is R4. 100 [%] equal to bend speed.  
(setting of parameter → machine setting 1 → pressure boost displayed as each proportional valve selection)
### R5 PRESSURE BOOST SPEED RATIO
You can set the speed of pressure boost, when step position is R5. 100 [%] equal to bend speed.  
(setting of parameter → machine setting 1 → pressure boost displayed as each proportional valve selection)
### PRESSURE BOOST DELAY TIMER
In usual case, bend and pressure boost advance start motion at the same time. If this timer is set, pressure boost starts to move for the set time later.  
(setting of parameter → machine setting 1 → pressure boost displayed as selection other than NO)
### PRESSURE BOOST PRIOR TIMER
In usual case, bend and pressure boost advance start motion at the same time. If this timer is set, pressure boost starts to move for the set time prior.  
(setting of parameter → machine setting 1 → pressure boost displayed as selection other than NO)
### YOU CAN CHANGE PRESSURE BOOST FORCE FOR EACH BEND ANGLE
During bend motion, force changes, responding to angle, in accordance with set value. In this setting, force for a bend angle is input and, during bend motion, it changes force of pressure boost, corresponding to the charged amount of force for set adjacent 2 bends angle.  
Setting of first bend angle is 0.00 [°] and fixed.  
However it does not work depending upon machine specification.  
(setting of parameter → machine setting 1 → pressure boost displayed as selection of hybrid)
### Pressure Table
| Bend angle [°] | Pressure |
|----------------|----------|
| 1              | 6.00     |
| 2              | 7.00     |
| 3              | 8.00     |
| 4              | 8.00     |
| 5              | 7.00     |
Force changes, during bend motion, in accordance with the graph of above right side drawing.  
This data can be created up to 10 pieces for each working file.
### Pressure Data No.
After you create it, since bend amount and bend corrective amount of FPB data are displayed in the screen right side, please set which pressure boost force data is to be used for each process.
## 2. Any Tables (Preserve Formatting)
### Pressure Table
| Bend angle [°] | Pressure |
|----------------|----------|
| 1              | 6.00     |
| 2              | 7.00     |
| 3              | 8.00     |
| 4              | 8.00     |
| 5              | 7.00     |
## 3. Key Data Points and Values
- R2 Pressure Boost Speed Ratio: 100 [%] equal to bend speed
- R3 Pressure Boost Speed Ratio: 100 [%] equal to bend speed
- R4 Pressure Boost Speed Ratio: 100 [%] equal to bend speed
- R5 Pressure Boost Speed Ratio: 100 [%] equal to bend speed
- Pressure Boost Delay Timer: Set time later
- Pressure Boost Prior Timer: Set time prior
- Bend angle settings and corresponding pressures:
  - Bend angle 1: 6.00
  - Bend angle 2: 7.00
  - Bend angle 3: 8.00
  - Bend angle 4: 8.00
  - Bend angle 5: 7.00
## 4. Document Structure (Headers, Sections, etc.)
- R2 PRESSURE BOOST SPEED RATIO
- R3 PRESSURE BOOST SPEED RATIO
- R4 PRESSURE BOOST SPEED RATIO
- R5 PRESSURE BOOST SPEED RATIO
- PRESSURE BOOST DELAY TIMER
- PRESSURE BOOST PRIOR TIMER
- YOU CAN CHANGE PRESSURE BOOST FORCE FOR EACH BEND ANGLE
- Pressure Table
- Pressure Data No.
## 5. Any Forms or Structured Data
- No specific forms were identified in the document. The structured data is primarily in the form of the pressure table.
--- Page 43 (Azure OpenAI Vision) ---
# Extracted Information from Document Page
## 1. Text Content
### Setting of Feed Follow Thrust
You can set the thrust of feed follow boost, which push pipe from backside during bend motion. Each data will be stored when the SAVE button is pushed or screen is changed.
During bend motion, thrust changes in accordance with set value, responding to bend angle. In this setting, thrust for a bend angle is input and, during bend motion, it changes thrust of feed follow boost, corresponding to the charged amount of thrust for set adjacent 2 bends angle.
Setting for first bend angle is 0.00 [°] and is fixed.  
(setting of parameter → machine setting 1 → machine model setting is displayed as KBB series selection)
Thrust changes in accordance with the graph of the above right side drawing during bend motion. This data can be created up to 10 pieces for each working file.
After you create it, since bend amount and bend corrective amount of FPB data are displayed in the screen right side, please set which feed follow thrust data is to be used for each process.
## 2. Tables
### Table 1: Thrust Data
| Process No. | Bend Amount | Corrective Amount | Pressure Data No. |
|-------------|-------------|-------------------|--------------------|
| 1           | 30.00       | 0.00              | 0                  |
| 2           | 45.00       | 0.00              | 0                  |
| 3           | 60.00       | 0.00              | 0                  |
| 4           | 90.00       | 0.00              | 0                  |
| 5           | 60.00       | 0.00              | 0                  |
### Table 2: Bend Angle and Thrust
| Bend angle [°] | Thrust |
|----------------|--------|
| 0.00           | 7.00   |
| 1              | 10.00  |
| 2              | 20.00  |
| 3              | 30.00  |
| 4              | 60.00  |
| 5              | 10.00  |
## 3. Key Data Points and Values
- **First Bend Angle**: 0.00 [°] (fixed)
- **Thrust Data**: Up to 10 pieces for each working file.
- **Process Data**: 
  - Process No. 1: Bend Amount 30.00, Corrective Amount 0.00
  - Process No. 2: Bend Amount 45.00, Corrective Amount 0.00
  - Process No. 3: Bend Amount 60.00, Corrective Amount 0.00
  - Process No. 4: Bend Amount 90.00, Corrective Amount 0.00
  - Process No. 5: Bend Amount 60.00, Corrective Amount 0.00
## 4. Document Structure
- **Header**: Setting of Feed Follow Thrust
- **Sections**:
  - Introduction to thrust setting
  - Explanation of thrust changes during bend motion
  - Tables for thrust data and bend angles
  - Instructions for setting feed follow thrust data for processes
## 5. Forms or Structured Data
- **Thrust Data Selection**: 
  - Thrust data can be created and selected for each process.
  - Thrust data numbers range from 1 to 10, with a selection interface indicated in the document.
This structured output preserves the essential information from the document while organizing it for clarity and ease of understanding.
--- Page 44 (Azure OpenAI Vision) ---
# Document Extraction and Structuring
## 1. Text Content
### FEED PRIOR BOOST TIMER
In usual case, bend and feed follow boost advance start at the same time. If this timer is set, feed follow boost advances for set time portion prior and adds pressure.
### FEED FOLLOW RANGE
Setting to raise alarm [feed follow abnormal deviation], when, during bend process, abnormal condition occurs. When feed follow boost feed pressure from back side of pipe, it could happen that too much thrust crashes pipe or break pipe. If such phenomenon occurs, feed follow boost advances vigorously without resistance of object to add pressure, and interferes with the thing which is ahead and might cause trouble of bender. In order to prevent this, setting is done to raise alarm, if feed follow boost advances to an extent against arc length of the process which makes bend process. Since, if pipe is bent, it always occurs elongation, feed follow amount is not equal to arc length of theoretical value and becomes short distance, alarm is made to rise based upon arc length. Setting is 100.00 [%] equal to arc length. For example, when [feed follow range] is 105.00 [%], arc length of bend is 50.00 [mm], if follow amount of feed in bend process exceeds 52.50 [mm], it raises alarm and bender stops at once.
### FEED FOLLOW CORRECTIVE VALUE
Setting to raise alarm [feed follow abnormal deviation] same as [feed follow range]. Since [feed follow range] setting is [%] input, if angle of bend is little, that is short arc length, it might cause alarm, although it is not abnormal. Because of this, you can set the range to raise alarm even (1°) input. At the corresponding bend angle, the range to raise alarm is [feed follow range] + [feed follow corrective value]. When the example shown in [feed follow range], if feed follow corrective value is set:
- 0° ≤ θ ≤ 15°: ••• 10 [mm]
- 15° < θ ≤ 30°: ••• 8 [mm]
- 30° < θ ≤ 60°: ••• 4 [mm]
- 60° < θ ≤ max. bend angle: ••• 0 [mm]
If bend process (arc length is 6.98 [mm]) at bend radius 40 [mm] is done, alarm will be raised when feed follow amount in bend process exceeds 17.33 [mm].
## 2. Tables
| Angle (θ)          | Feed Follow Corrective Value |
|--------------------|------------------------------|
| 0° ≤ θ ≤ 15°       | 10 [mm]                      |
| 15° < θ ≤ 30°      | 8 [mm]                       |
| 30° < θ ≤ 60°      | 4 [mm]                       |
| 60° < θ ≤ max. bend angle | 0 [mm]               |
## 3. Key Data Points and Values
- **Feed Follow Range Setting**: 100.00 [%]
- **Example Feed Follow Range**: 105.00 [%]
- **Arc Length of Bend**: 50.00 [mm]
- **Feed Follow Amount Threshold**: 52.50 [mm]
- **Corrective Values**:
  - 0° ≤ θ ≤ 15°: 10 [mm]
  - 15° < θ ≤ 30°: 8 [mm]
  - 30° < θ ≤ 60°: 4 [mm]
  - 60° < θ ≤ max. bend angle: 0 [mm]
- **Alarm Trigger Condition**: Exceeds 17.33 [mm]
## 4. Document Structure
- **Header**: FEED PRIOR BOOST TIMER
- **Section**: FEED FOLLOW RANGE
- **Section**: FEED FOLLOW CORRECTIVE VALUE
## 5. Forms or Structured Data
- No specific forms or structured data were identified in the document. The information is presented in a narrative format and a table.
--- Page 45 (Azure OpenAI Vision) ---
# Extracted Information from Document
## 1. Text Content
**DESIGNATE OPERATION**  
It designates working files to operate, in order to make automatic operation and make operation of individual operation.  
Push this icon to change to operation designation screen.
You select folder which has working file to operate. Since, if you select folder, working file in it will be displayed, please select working file to operate. Push ( [ operation designation] button to set working file at No.1 and set up each data to be able to make automatic operation.  
Then, when data of working file operation designated as No.1 is altered, push SAVE button of screen right side or change to any screen to setup data and bender can be operated with aimed working file.  
When you make automatic operation with working file of 1 article, input 1 for the setting of number of operations. You cannot make automatic operation with 0.
**WHEN YOU RELEASE OPERATION DESIGNATION.**  
If you push [release operation designation] button, it will disappear from operation designation column and be released.
**HOW TO SET ALTERNATE OPERATION**  
When you want to make alternate operation, push [alternate operation] button. Then make pop-up the display below. Place files to be processed in order at operation designation column and set number of operations of each working file.  
Since up to 5 working files designation can be done, alternate operation can be done up to max. 5 kinds.
**[>] button**  
It makes operation designation register of selected working file from No.1 up-aligned.
**[insert] button**  
Button to insert working file.  
Select operation designation No. of the place to be inserted, push [insert] button to insert working file. You cannot insert, if operation designation is done already up to No.5.
**[<] button**  
Button to release operation designation.  
Select operation designation No. to be released and push [<] button to release operation designation.
**[Complete] button**  
It completes alternate operation and closes set screen.  
When [complete] button is pushed, the working file name and No. will be displayed in operation designation screen part by the operation designated number.
## 2. Tables
| Folder   | Operation designation | Files   |
|----------|-----------------------|---------|
| Folder01 | C: No.1              | test-1  |
|          | C: No.2              |         |
|          | C: No.3              |         |
|          | C: No.4              |         |
|          | C: No.5              |         |
## 3. Key Data Points and Values
- Maximum number of working files designation: 5
- Input for setting number of operations: 1
- Cannot make automatic operation with: 0
## 4. Document Structure
- **Header**: DESIGNATE OPERATION
- **Sections**:
  - Designation of working files
  - Release operation designation
  - Setting alternate operation
  - Button functionalities
## 5. Forms or Structured Data
- **Buttons**:
  - [>] button
  - [insert] button
  - [<] button
  - [Complete] button
This structured output preserves the original formatting and key information from the document.
--- Page 46 (Azure OpenAI Vision) ---
# Extracted Information
## 1. Text Content
### [Change] Button
This button is used to alter the working file which is set for alternate operation.
When operation designation is done like above drawing, the order to operate is below.
If A is operated continuously for 3 cycles, then operation starts in accordance with working file B. After operation of B for 2 continuous cycles, operation starts in accordance with working file C. After operation of C for 4 continuous cycles, operation of A starts again. In this way, after cycle operation by the times which is designated by the number of operations, it makes operation in accordance with the working file which is made operation designation.
If you push [add] button of number of operations, the number of operations increases by 1. If you push [reduce] button, it decreases by 1.
### Continuation of Alternate Operation
When alternate operation is set and you make automatic operation and stop automatic operation once changing to manual mode, you can re-start automatic operation from the preceding part of alternate operation. When it is changed to auto mode, the message [Do you continue alternate operation?] will be displayed. If you push OK, alternate operation will be continued, and if cancel is pushed, automatic operation will start from No.1 operation designation.
If you change to manual mode and alter settings of number of operations, pieces counter or alter operation designation, alternate operation will not be continued.
### Setting of Pieces Counter
You can set pipe pieces to be produced and automatic operation will be made by the set number of pieces.
Input pipe pieces to be produced to set the number of pieces. You can set ± 1 each with [add], [reduce] button. If automatic operation is done, it will count 1 piece after the finish of 1 cycle. If count is done, it becomes the number of pieces of production + 1, remaining number of pieces - 1.
During temporary stop in automatic operation only, you can alter the setting of number of pieces of production. When the cursor is on the number of pieces of production, [add] [reduce] button works too. Set number of pieces also can be altered during temporary stop in auto operation.
After repeated automatic operations, when produced pieces attain set number of pieces, an alarm (pieces count up) occurs. Please push [reset] button twice to release [pieces count up] alarm. The first [reset] button stops the buzzer to inform the alarm. The 2nd [reset] button resets the alarm and makes 0 reset of the number of pieces of production or of pieces counter setting.
## 2. Tables
| **No.** | **Change** | **Number of operations** | **Pieces counter** | **File information** |
|---------|------------|--------------------------|--------------------|----------------------|
| No. 1   |            | 2                        |                    |                      |
| No. 2   |            | 2                        |                    |                      |
| No. 3   |            | 4                        |                    |                      |
| No. 4   |            | 0                        |                    |                      |
| No. 5   |            |                          |                    |                      |
## 3. Key Data Points and Values
- Number of operations can be increased or decreased by 1 using [add] or [reduce] buttons.
- Automatic operation can be set to produce a specified number of pipe pieces.
- Alarm occurs when produced pieces reach the set number.
- Resetting alarms requires pressing the [reset] button twice.
## 4. Document Structure
- **Section 1:** [Change] Button
- **Section 2:** Continuation of Alternate Operation
- **Section 3:** Setting of Pieces Counter
## 5. Forms or Structured Data
- Input fields for setting the number of pieces to be produced.
- Buttons for [add], [reduce], and [reset] operations.
--- Page 47 (Azure OpenAI Vision) ---
# Document Extraction and Structuring
## 1. Text Content
When plural working files are operation designated, there are 2 kinds of stop. One method is, when any of working file data counts up (count set number of pieces) (when count-up step method of plural operation designation of parameter is 1CH set), it stops and another is, when all working file data which are operation designated count up, it stops (when count-up step method of multiple operation designation of parameters is ALL set).
In case of the former, after count-up alarm occurs and then it moves to pipe supply position based upon working file data which has not counted up. After release of alarm by pushing [reset] button, automatic operation will restart if [auto start] button is pushed. When all working files which are operation designated count up, automatic operation stops. When alarm is released with [reset] button, production number of pieces also is 0 reset. After reset, it waits for auto start button and, if auto start button is pushed, it starts auto operation from start again. However, since working file shoes set value of set number of pieces is 0 does not count up, bender continues automatic operation without stopping at pieces count up.
In case of the latter, after count-up, alarm occurs, but, when it moves to pipe supply position of next cycle, alarm is reset automatically. Auto operation continues as it is and bender stops after count-up of all working files data which are operation designated. The same as the former, when alarm is released with [reset] button, production number of pieces also is 0 reset and waits for auto start button. If auto start button is pushed, it starts auto operation from start again. However, since working file shoes set value of set number of pieces is 0 does not count up, bender continues automatic operation without stop at pieces count up.
## 2. Tables
### FILE INFORMATION
| **Field**      | **Description**                                                                 |
|----------------|---------------------------------------------------------------------------------|
| Folder name    | It displays folder name which contains working files operation designated as No.1~5. |
| Article No.    | It displays article No. which is set in working files operation designated as No.1~5. |
| Remark         | It displays remark written in working files operation designated as No.1~5.     |
## 3. Key Data Points and Values
- **Types of Stops**: 
  - Count-up method (stops when data counts up)
  - All working files count up (stops when all designated files count up)
  
- **Reset Mechanism**: 
  - Alarm reset by [reset] button
  - Production number resets to 0
  
- **Auto Start**: 
  - Triggered by [auto start] button
  - Resumes operation from the start
## 4. Document Structure
- **Introduction**: Explanation of operation designation and stopping methods.
- **File Information**: Details about folder name, article number, and remarks.
## 5. Forms or Structured Data
- No specific forms or structured data were identified in the provided text. The information is primarily descriptive and tabular.
--- Page 48 (Azure OpenAI Vision) ---
# Document Extraction
## 1. Text Content
### AUTOMATIC OPERATION
We make automatic operation with created working file.
Before the start of operation, please make sure that nobody nor nothing is in the motion range of bender and start operation.  
The flow of automatic operation is below.
1. Turn electric power ON (breaker ON, electric power ON key-switch ON) to start up bender application.  
2. Make operation designation of file to be processed. If working file is not available, create new working file with new creation wizard.  
3. Turn operation preparation ON, [operation preparation] button lights up green.  
4. Change to auto mode. [Auto mode] button lights up green.  
5. [Auto start] button flashes and if you push button, it moves to pipe supply position. Please push button after you make sure that nobody nor nothing is in the motion range of bender.  
6. Input pipe. If you push [chuck close] button, pipe is gripped with chuck. If you want to re-grip pipe, push [chuck close] button again. Chuck releases pipe.  
7. If you push [auto start] button (you may push any one, that of operation panel and of operator pedestal), automatic operation starts.  
   It makes process from first process in turn.  
8. After completion of bend motion of last process, motion stops. Push [material removal] button and remove processed pipe. In this case, if you push [material removal] button, it will unclamp (clamp, pressure and chuck are opened). Therefore push button carefully.  
9. After removal of pipe, move it to pipe supply position of next cycle to make process of next pipe. If you push [original point] button, it moves to pipe supply position.  
10. Repeat steps 6-9.
### HOW TO MAKE TEMPORARY STOP
You can stop automatic operation temporarily.
During automation operation, push [temporary stop] button in the operation panel. Operation stops at the time of button push and [temporary stop] button lights up red.  
When [temporary stop] button is pushed during motion, it stops after completion of positioning. When [bend halfway temporary stop] set of setting of parameter is YES, as far as bend is concerned, it stops at the time of [temporary stop] button push, even if positioning has not been completed. The working file data during automatic operation can change data only during temporary stop though is not basically revocable. When data is changed, SAVE button of the screen right up side becomes effective and the message [Data has changed. Change screen or press SAVE] will be displayed. Before restart of auto operation, please setup altered data either by pushing SAVE button or change to other screen.
### OPERATION BY ONE STEP
During temporary stop, if you push [auto start] button (you may push either that of operation panel or that of operator pedestal), it makes motion of 1 step and stops. If you push [auto start] button again, it makes motion by 1 step and stops again. In this way, if you push [auto start] button during temporary stop, it makes motion by 1 step each. However be careful that this 1 step is not only handling of motion but it includes inside handling, therefore it makes not always motion.
---
## 2. Tables
*No tables were present in the document.*
---
## 3. Key Data Points and Values
- **Operation Steps:**
  - Step 1: Turn electric power ON
  - Step 2: Make operation designation of file
  - Step 3: Turn operation preparation ON
  - Step 4: Change to auto mode
  - Step 5: Push [Auto start] button
  - Step 6: Input pipe
  - Step 7: Push [auto start] button to start automatic operation
  - Step 8: Push [material removal] button after last process
  - Step 9: Move pipe to supply position
  - Step 10: Repeat steps 6-9
- **Temporary Stop:**
  - Push [temporary stop] button to stop operation
  - Message displayed: [Data has changed. Change screen or press SAVE]
- **Operation by One Step:**
  - Push [auto start] button to make motion of 1 step
---
## 4. Document Structure
- **Header:** AUTOMATIC OPERATION
- **Sections:**
  - Automatic Operation Steps
  - How to Make Temporary Stop
  - Operation by One Step
---
## 5. Forms or Structured Data
*No forms or structured data were present in the document.*
--- Page 49 (Azure OpenAI Vision) ---
# Extracted Information
## 1. Text Content
### Release of Temporary Stop and Re-Start Auto Operation
During temporary stop, if you push [temporary stop] button, temporary stop will be released. Since it is only released and automatic operation will not start again, if you push [auto start] button in this state, automatic operation starts again. In order to make temporary stop state again, after you push auto start once and restart automatic operation, then it can be temporary stop state.
### How to Outer Article No. Input, Outer Article No. Output
You can move bender automatically from outer equipment by using working files which are registered in article No. list of operation designation screen.
When check mark is put in [Outer article No. input] of operation designation screen and article No. is designated from outer equipment (outer article No. input), if the designated article No. is registered in the list for outer article No. in/output, the motion of corresponding working file can be done.
When designation of article No. is output from bender to outer device (outer article No. output). When outer article No. output of setting of parameter is YES, if the working file to make auto operation is resisted in the list for outer article No. in/output, the article No. can be output.
### Input Limitation of Article No.
Since settings of parameter can stipulate how many bits of article No. can be input (name: input limitation of article No.), it could happen that input is restricted. (Input limitation of article No. 0 ≤ article No. ≤ 999).
## 2. Tables
### List for Outer Article No. In/Output
| Folder | List for outer article No. in/output |
|--------|-------------------------------------|
| [Folder] | A                                   |
| [File]   | 12345                                |
|          | abcde                                |
|          | test-1                               |
### Buttons
- [>] button: Register button to the list for outer article No. in/output.
- [<] button: Button to release register from list.
## 3. Key Data Points and Values
- **Input Limitation of Article No.:** 0 ≤ article No. ≤ 999
- **Files Listed:**
  - 12345
  - abcde
  - test-1
## 4. Document Structure
- **Header:** Release of Temporary Stop and Re-Start Auto Operation
- **Section 1:** How to Outer Article No. Input, Outer Article No. Output
- **Section 2:** Input Limitation of Article No.
## 5. Forms or Structured Data
- **Form Elements:**
  - Folder selection
  - File selection
  - List for outer article No. in/output
  - Buttons for registering and releasing items from the list.
--- Page 50 (Azure OpenAI Vision) ---
# Document Extraction
## 1. Text Content
**RETURN TO ORIGINAL POINT**  
You can return each drive part to the position of original point.
When bender stops in manual mode, it makes return to original point, if [original point return] button of operation panel is pushed. During the return to original point, [original point return] button flashes and the button stops flash, if original point return finishes.  
Positions of original point of each drive part are shown below.
## 2. Tables
*No tables are present in the document.*
## 3. Key Data Points and Values
- **Functionality**: Return each drive part to the original point.
- **Operation Mode**: Manual mode.
- **Button**: [original point return] button.
- **Indicator**: Button flashes during return to original point.
## 4. Document Structure
- **Header**: RETURN TO ORIGINAL POINT
- **Sections**:
  - Introduction to the functionality of returning to the original point.
  - Description of the operation mode and button functionality.
  - Visual representation of the positions of original points for each drive part.
## 5. Forms or Structured Data
*No forms or structured data are present in the document.*
---
### Visual Representation
The document includes a diagram illustrating the positions of various components during the return to the original point, with labeled arrows indicating actions such as:
- Clamp Open
- Bend To the position 0°
- Pressure Open
- Mandrel Retract
- Feed to the position of machine total length
- Follow lock release
- Chuck Open
This diagram is essential for understanding the mechanical operation described in the text.
--- Page 51 (Azure OpenAI Vision) ---
# Document Extraction and Structuring
## 1. Text Content
### Title
**HOW TO MAKE MANUAL MOVEMENT (OPERATION)**
### Introduction
You can move bender manually. Please move it carefully, paying attention to safety and environment.
Push this icon to change to individual operation screen.
### Description
There are two kinds of screen, one is illustration individual screen on which illustration of bender is drawn, and the other is button individual screen which has button only. The former is for those persons who are not accustomed to operation and has screen easy to understand with illustration explaining how to move. The latter is for those person who are accustomed to OPERATION. You can change the screen with change button of screen right up side.
Since the content of operations of 2 screens is the same, we explain below.
### Motion Data
Data that it wants to individual operate each is selected from among the working file that does designate operation. It moves based upon data of working file which was selected by motion data.
When operation designation is not done, [____] is displayed and you cannot do feed, plane, bend operation in DATA mode, pipe supply position movement bend start position movement, chuck close position movement and standby point movement operation in JOG/DATA mode. Also BF interference position, PD interference position, WD interference position, M interference position, pipe supporter interference position and middle supporter interference position move with [interference position with no operation designation] set by parameter.
### Move Feed, Plane, Bend
Motion direction is shown below.
### Move Feed to Pipe Supply Position, Bend Start Position, Standby Point, Chuck Close Position
- If you push [Pipe supply position] button, feed moves to pipe supply position.
- If you push [Bend start position] button, feed moves to bend start position.
- If you push [Standby point] button, feed moves to standby point.
- If you push [Chuck close position] button, feed moves to chuck close position.
## 2. Tables
*No tables were present in the document.*
## 3. Key Data Points and Values
- **Operation Modes**: DATA mode, JOG/DATA mode
- **Buttons and Functions**:
  - Pipe supply position
  - Bend start position
  - Standby point
  - Chuck close position
## 4. Document Structure
- **Title**: HOW TO MAKE MANUAL MOVEMENT (OPERATION)
- **Sections**:
  - Introduction
  - Motion Data
  - Move Feed, Plane, Bend
  - Move Feed to Pipe Supply Position, Bend Start Position, Standby Point, Chuck Close Position
## 5. Forms or Structured Data
*No forms or structured data were present in the document.*
--- Page 52 (Azure OpenAI Vision) ---
# Extracted Information from Document Page
## 1. Text Content
### MOVE WITH JOG
When mode is JOG, each device moves while you push button. When you keep pushing [Pipe supply position], [Bend start position], [Standby point], [Chuck close position] button, feed moves with JOG speed for the respectively set position.
### MOVE WITH DATA
When mode is data, it moves at one stroke based upon FFB data of working file data which is shown in the screen above side or set value of pipe supply position, bend start position, standby point, and chuck close position.
**Process No.**  
You designate aimed process No. with [↑][↓] button, it moves to the direction for which button is pushed with displayed speed and set value (displayed set value * by corrective amount portion moves).  
But [Return] of bend returns automatically up to position 0°.  
Also speed, set value and corrective value can be altered in this screen as you wish. The altered numeric values are not reflected to FFB data.
In case of normal bend (torque limit) and boost bend (adding pressure from back and with feed follow boost) are done.  
When you want to make DATA bend gripping pipe with chuck actually, please do it closing chuck and clamp (output ON state) without fail. If any one of them is open, fed does not follow. Be careful.
In case of KBB series bender, you can set normal bend and boost bend for each process. The process that is displayed now is which bend, is displayed at the side of process No.
**Boost bend**  
**Thrust graph display**  
Thrust graph display button displays, if it is boost bend, graph of thrust data No. which is set to the process displayed at present. In case of KB series bender, it has not this display.
### MOVE CLAMP, PRESSURE, MANDREL, PRESSURE BOOST, FEED FOLLOW BOOST
Motion direction is shown below. Also mandrel, pressure boost, feed follow boost cannot be made individual operation, depending upon bender.
The above drive parts move all in inching. If you push each operation button more than 3 seconds, output is maintained.
## 2. Tables
| **Process No.** | 1/4 |  |
|------------------|-----|--|
| **Boost bend**   |     |  |
| **Thrust graph display** |  |  |
## 3. Key Data Points and Values
- **Process No.**: 1/4
- **Bend Return Position**: Automatically returns to position 0°
- **Operation Duration for Output Maintenance**: More than 3 seconds
## 4. Document Structure
- **Headers**:
  - MOVE WITH JOG
  - MOVE WITH DATA
  - MOVE CLAMP, PRESSURE, MANDREL, PRESSURE BOOST, FEED FOLLOW BOOST
- **Sections**:
  - Description of JOG and DATA modes
  - Process No. designation
  - Normal and boost bend operations
  - Motion direction and operation details
## 5. Forms or Structured Data
- **Buttons**:
  - [Pipe supply position]
  - [Bend start position]
  - [Standby point]
  - [Chuck close position]
  - [↑] [↓]
  - [Return]
  
This structured output preserves the original formatting and key information from the document page.
--- Page 53 (Azure OpenAI Vision) ---
# Extracted Information from Document Page
## 1. Text Content
- **MOVE CHUCK, CHUCK TABLE, MANDREL TABLE, STOPPER, FOLLOW LOCK**
  - Motion direction is shown below. Also, mandrel table, follow lock cannot be made individual operation, depending upon bender.
  
- **Chuck moves in inches.** If you push operation button more than 3 seconds, output is maintained. Chuck table-mandrel table cross movement and up/down and follow lock maintain output, if operation button is pushed once. However, chuck-mandrel table cross movement become output OFF, if motion completes.
- **MAKE MANDREL OIL SUPPLY**
  - Only when mandrel oil supply device is installed optionally, you can supply oil while [mandrel oil supply] button is pushed.
- **INPUT AND OUTPUT MONITOR**
  - **INPUT**
    - When each sensor turns ON, lamp beside button on the screen lights up green.
      - Sensor OFF
      - Sensor ON
    - When there is no sensor, lamp is not displayed (lamp of boost retract operation button lights up when X9D, feed follow original point sensor is ON. Also lamp which locates in the middle of pressure operation button lights up when X7F, sensor of pressure middle open is ON).
- **OUTPUT**
    - When operation button is pushed, if output is ON, the outside of operation button will be surrounded with red frame.
    - If you push all screens delete button of illustration individual screen, each equipment screen displayed are all deleted.
## 2. Tables
| Component          | Description                                                                 |
|--------------------|-----------------------------------------------------------------------------|
| Chuck              | Moves in inches. Maintains output if operation button is pressed for >3 sec. |
| Chuck Table        | Cross movement with mandrel table.                                          |
| Mandrel Table      | Cross movement with chuck table.                                            |
| Follow Lock        | Cannot be operated individually.                                            |
| Mandrel Oil Supply | Optional installation required to supply oil.                              |
## 3. Key Data Points and Values
- **Operation Button Duration**: More than 3 seconds to maintain output.
- **Sensor Status**: 
  - Sensor OFF
  - Sensor ON
- **Output Status**: 
  - If output is ON, the operation button is surrounded by a red frame.
## 4. Document Structure
- **Header**: MOVE CHUCK, CHUCK TABLE, MANDREL TABLE, STOPPER, FOLLOW LOCK
- **Sections**:
  - Chuck Movement
  - Make Mandrel Oil Supply
  - Input and Output Monitor
    - Input
    - Output
## 5. Forms or Structured Data
- **Input Monitor**:
  - Sensor ON/OFF indicators.
- **Output Monitor**:
  - Operation button status (ON/OFF).
This structured output preserves the content and formatting of the original document while organizing the information clearly.
--- Page 54 (Azure OpenAI Vision) ---
# Extracted Information
## 1. All Text Content
**MOVE OPTION EQUIPMENT**  
Push of screen right up side to change to option individual screen where you can operate optional equipment. You can make individual operation of optional equipment there.
**Allotment of button**  
Operation button of optional equipment only, you can allot the place of button and output method.  
When you log-in with management user level, [Button placement change] button is displayed at the screen right up side. Push that button to change to allotment of optional equipment operation button screen.
**Procedure of allotment**  
Since the name of drive parts are displayed as a list in (1) box, please select drive parts to be allotted among them.  
Then you select output method from (2) box.  
- Alternate: If button is pushed once, output maintains ON.  
- As for supply output 1, supply output 2, robot output 1, robot output 2, robot output 3, if you push button one more in the state of output ON, output becomes OFF.  
- Momentary: Output is ON while button is pushed. If you hand off button, output becomes OFF.  
- When you allot [Bead detection], selection of alternate/momentary is not necessary. If you push [Bead detection operation] button, bead motor will keep moving until bead is detected or alarm occurs.  
Select the place to be allotted. If you select it, it will be surrounded with red frame.  
When you push fix button, they are allotted.
**Delete allotted button**  
Select button to be deleted and push delete button to delete.
**Finish allot operation**  
If you push return button, allotted result is stored and screen returns.
## 2. Any Tables (Preserved Formatting)
| Split D | Alternate | Fix | Cancel | Back |
|---------|-----------|-----|--------|------|
|         |           |     |        |      |
|         |           |     |        |      |
|         |           |     |        |      |
|         |           |     |        |      |
|         |           |     |        |      |
## 3. Key Data Points and Values
- **Button Types**:
  - **Alternate**: Maintains output ON when pushed once.
  - **Momentary**: Output is ON while button is pushed.
- **Actions**:
  - Select drive parts from a list.
  - Select output method.
  - Fix button to allot selected parts.
  - Delete button to remove allotted parts.
  - Return button to store results and return to the screen.
## 4. Document Structure
- **Header**: MOVE OPTION EQUIPMENT
- **Sections**:
  - Allotment of button
  - Procedure of allotment
  - Delete allotted button
  - Finish allot operation
## 5. Any Forms or Structured Data
- **Button Selection**: 
  - Drive parts selection (1) box
  - Output method selection (2) box
- **Button Actions**: Fix, Cancel, Back, Delete
This structured output preserves the content and formatting from the original document while organizing the information clearly.
--- Page 55 (Azure OpenAI Vision) ---
# Extracted Information from Document
## 1. Text Content
**PRODUCTION MANAGEMENT SCREEN**  
Cycle time, production completion scheduled time, histories of daily report are displayed.
Push icon of in the "Others" icon group to change to production management screen.
It displays present time.  
**As for operation conditions,**  
- **File name**  
  Working file name which is under automatic operation now.  
- **Cycle time**  
  Time required for one cycle.  
- **Accumulated time**  
  Total operation time of process data file which is under automatic operation now.  
- **Scheduled finish time**  
  Scheduled finish time when remaining number of pieces will complete the process.  
- **Availability**  
  Operation ratio of working file data, which is now under automatic operation now, since electric power is turned on, are displayed.
**As for daily report**  
- **File name**  
  Working file name which is done automatic operation.  
- **Production data**  
  Year, month, date when automatic operation is done.  
- **Production start time**  
  Time when automatic operation is started.  
- **Production finish time**  
  Time when automatic operation is finished.  
- **Set number of pieces**  
  Setting of set number of pieces when automatic operation is started.  
- **Number of pieces of production**  
  Number of pieces which are produced.  
- **Cycle time**  
  Time required for 1 cycle, are displayed.
When you log-in as management user, you can clear all daily report. Please push history clear button of screen right down side to clear.
---
## 2. Tables
*No tables were present in the document.*
---
## 3. Key Data Points and Values
- **Cycle Time**: Time required for one cycle.
- **Accumulated Time**: Total operation time of process data file under automatic operation.
- **Scheduled Finish Time**: Time when remaining pieces will complete the process.
- **Production Start Time**: Time when automatic operation is started.
- **Production Finish Time**: Time when automatic operation is finished.
- **Set Number of Pieces**: Setting of pieces when automatic operation is started.
- **Number of Pieces of Production**: Number of pieces produced.
---
## 4. Document Structure
- **Header**: PRODUCTION MANAGEMENT SCREEN
- **Sections**:
  - Operation Conditions
  - Daily Report
---
## 5. Forms or Structured Data
*No forms or structured data were present in the document.*
--- Page 56 (Azure OpenAI Vision) ---
# Extracted Information from Document
## 1. Text Content
**MOTION MONITOR**  
Monitoring of process number operation, present position monitor of feed, plane, bend, progress situation of editing sequence, pieces counter and cycle time are done here.  
Push this icon to change to motion monitor screen.
### MOTION MONITOR 1
**SPEED, SET VALUE AND PRESENT POSITION OF FEED, PLANE, BEND**  
It displays speed and set value (amount to move) at which feed, plane and bend move next, and present position.
**PIPE SUPPLY POSITION, BEND START POSITION, CH CLOSE POSITION, STANDBY POINT**  
It displays pipe supply position, bend start position, and chuck close position, standby point of working file which is under operation now.
**FILE NAME**  
It displays working file under operation now.
**PROCESS No.**  
It displays process No. under operation now.
**MAIN PRO.**  
It displays function number under operation now.
**BEFORE BEND, AFTER BEND**  
It displays editing sequence progress situation of before bend sequence area and after bend sequence area.
**SUB PROGRAM1 ~ SUB PROGRAM10, SUB PROGRAM21 ~ SUB PROGRAM25, SUB PROGRAM31**  
It displays editing sequence progress situation of each editing sequence area.
**FLAG MONITOR**  
You can make panel display of ON or OFF state of dedicated, general flag.
**SET NUMBER OF PIECES, NUMBER OF PIECES OF PRODUCTION, REMAINING NUMBER OF PIECES**  
It displays settings of pieces counter under operation now.
**CYCLE TIME**  
It displays the time which was required for 1 cycle of working file under operation now.
### MOTION MONITOR 2
**PRESSURE FORCE**  
It displays the set pressure force and pressure which is applied now.  
(setting of parameter → machine setting 2 → displayed as check [Yes] to Pressure force adjustment from screen)
**PRESSURE BOOST FORCE**  
It displays set force of pressure boost force and force which is applied now.  
(setting of parameter → machine setting 2 → displayed as check [Yes] to Pressure boost force adjustment from screen)
---
## 2. Tables
| **Section** | **Description** |
|-------------|------------------|
| MOTION MONITOR 1 | Monitoring of process number operation, present position monitor of feed, plane, bend, progress situation of editing sequence, pieces counter and cycle time are done here. |
| SPEED, SET VALUE AND PRESENT POSITION OF FEED, PLANE, BEND | Displays speed and set value (amount to move) at which feed, plane and bend move next, and present position. |
| PIPE SUPPLY POSITION, BEND START POSITION, CH CLOSE POSITION, STANDBY POINT | Displays pipe supply position, bend start position, and chuck close position, standby point of working file which is under operation now. |
| FILE NAME | Displays working file under operation now. |
| PROCESS No. | Displays process No. under operation now. |
| MAIN PRO. | Displays function number under operation now. |
| BEFORE BEND, AFTER BEND | Displays editing sequence progress situation of before bend sequence area and after bend sequence area. |
| SUB PROGRAM1 ~ SUB PROGRAM10, SUB PROGRAM21 ~ SUB PROGRAM25, SUB PROGRAM31 | Displays editing sequence progress situation of each editing sequence area. |
| FLAG MONITOR | Panel display of ON or OFF state of dedicated, general flag. |
| SET NUMBER OF PIECES, NUMBER OF PIECES OF PRODUCTION, REMAINING NUMBER OF PIECES | Displays settings of pieces counter under operation now. |
| CYCLE TIME | Displays the time which was required for 1 cycle of working file under operation now. |
| MOTION MONITOR 2 | Displays the set pressure force and pressure which is applied now. |
| PRESSURE BOOST FORCE | Displays set force of pressure boost force and force which is applied now. |
---
## 3. Key Data Points and Values
- **Speed and Set Value**: Amount to move for feed, plane, and bend.
- **Pipe Supply Position**: Current position of the pipe supply.
- **Bend Start Position**: Current position of the bend start.
- **File Name**: Current working file.
- **Process No.**: Current process number.
- **Main Pro.**: Current function number.
- **Before Bend / After Bend**: Progress situation of editing sequences.
- **Sub Programs**: Various sub-programs in operation.
- **Flag Monitor**: ON/OFF state of flags.
- **Set Number of Pieces**: Current settings for pieces counter.
- **Cycle Time**: Time required for one cycle of the working file.
- **Pressure Force**: Set pressure force applied.
- **Pressure Boost Force**: Set force of pressure boost applied.
---
## 4. Document Structure
- **Main Title**: MOTION MONITOR
- **Sections**:
  - MOTION MONITOR 1
  - MOTION MONITOR 2
- **Subsections**: Each section contains multiple subsections detailing specific functionalities.
---
## 5. Forms or Structured Data
- No explicit forms were identified in the document. The data is presented in a structured textual format without interactive forms.
--- Page 57 (Azure OpenAI Vision) ---
# Document Extraction
## 1. Text Content
### FEED FOLLOW
It displays the thrust which is applied by feed follow boost now.  
(setting of parameter → machine setting 1 → displays when machine model setting is KBB)
### PRESSURE BOOST HYBRID
It displays thrust which pressure boost applies at present.  
(setting of parameter → machine setting 1 → displays when pressure boost is hybrid)
### I/O MONITOR
Monitoring of ON/OFF situation of in/output, servo operation situation of the device which is driven by AC servo motor is done here.  
Push this icon to change to I/O monitor screen.
### INPUT MONITOR
It monitors ON/OFF of input which is allotted to input card. When the input has been turned on, it lights to green.  
Figures of X____ which is displayed at left side of input name indicates input number. When you use parts relating to input in editing sequence, use this number. On the marktube of relative wiring, this number is marked. As far as input of contact is concerned, however, it lights up green if switches become ON.
### OUTPUT MONITOR
It monitors ON/OFF of output which is allotted to output card. When the output has been turned on, it lights to green.  
Figures of Y____ which is displayed at left side of output name indicates output number. When you use parts relating to output in editing sequence, use this number. On the marktube of relative wiring, this number is marked.
### ORIGINAL POINT MONITOR
It monitors original point of AC servo, monitor of ON/OFF of overrun (limit), situation of servo alarm, servo ready.
---
## 2. Tables
*No tables were present in the provided document content.*
---
## 3. Key Data Points and Values
- **Feed Follow Setting**: Machine setting 1 (KBB)
- **Pressure Boost Setting**: Machine setting 1 (Hybrid)
- **Input Monitor**: 
  - Input status: ON (lights green)
  - Input number: X____
- **Output Monitor**: 
  - Output status: ON (lights green)
  - Output number: Y____
- **Original Point Monitor**: Monitors ON/OFF of overrun (limit), servo alarm, and servo readiness.
---
## 4. Document Structure
- **Headers**:
  - FEED FOLLOW
  - PRESSURE BOOST HYBRID
  - I/O MONITOR
  - INPUT MONITOR
  - OUTPUT MONITOR
  - ORIGINAL POINT MONITOR
---
## 5. Forms or Structured Data
*No forms or structured data were present in the provided document content.*
--- Page 58 (Azure OpenAI Vision) ---
# Document Extraction
## 1. Text Content
### HOW TO TEACHING
Teaching function can stop temporarily automatic operation before bend, after bend, move bender freely and create editing sequence program.
### PREPARATION OF TEACHING
When you use teaching function for all processes, just after the start of automatic operation, make temporary stop and push [Teach] icon of tool bar for 2 seconds. If it turns to red, it is teaching mode.  
When you designate only the place to use teaching, select before bend sequence, after bend sequence of FPB screen as teaching. That means the data which is made teaching goes to before bend sequence area, if it is done before bend, and goes to after bend sequence area, if it is done after bend.
### TEACHING OPERATION
You ready want to Teaching?  
It makes automatic operation and stops at the step of before bend, after bend sequence and message will be displayed. By selection here [OK], starts teaching operation.
## 2. Tables
| Supply condition          | Motion setting        | Each process details 1 | Each process details 2 | Corrective        |
|--------------------------|----------------------|------------------------|------------------------|-------------------|
| Temporary advance motion  |                      |                        |                        |                   |
| Chuck re-pre motion      | ON                   |                        |                        |                   |
| Plane motion after bend   | ON                   |                        |                        |                   |
| Bend back prohibition     | OFF                  |                        |                        |                   |
| Sequence before bend      | Teaching             | Editing                | Sequence after bend     | OFF               |
| Chuck recaptures motion   |                      |                        |                        |                   |
| Bend corrective motion return |                  |                        |                        |                   |
## 3. Key Data Points and Values
- Teaching function: Stops automatic operation before and after bend.
- Teaching mode activation: Push [Teach] icon for 2 seconds.
- Sequence before bend: OFF
- Sequence after bend: OFF
- Motion settings: 
  - Chuck re-pre motion: ON
  - Plane motion after bend: ON
  - Bend back prohibition: OFF
## 4. Document Structure
- **Header**: HOW TO TEACHING
- **Sections**:
  - Preparation of Teaching
  - Teaching Operation
## 5. Forms or Structured Data
- Confirmation dialog for teaching operation:
  - Message: "You ready want to Teaching?"
  - Buttons: [OK], [Cancel]
--- Page 59 (Azure OpenAI Vision) ---
# Extracted Information from Document Page
## 1. Text Content
- **Step No.**
- **STEP 1**: Select one to make motion among each item. If selection is done, it will be displayed in red character.
- **STEP 2**: Push Move or Remove to the direction which you want to move, and push Save, then instructions of movement is created automatically from the result of movement. If you have other things to move, repeat step 1 and 2.
- Motion direction of drive parts, when [motion side] or [return side] button is pushed, is displayed below.
- **Note**: Those whose drive part is not mounted on bender does not make motion.
## 2. Tables
### Motion Direction of Drive Parts
| Drive part                | Motion side         | Return side       |
|--------------------------|---------------------|-------------------|
| Feed                     | Advance             | Retract           |
| Bend                     | Bend                | Retract           |
| Plane                    | Normal turn         | Reverse turn      |
| Chuck                    | Close               | Open              |
| Clamp                    | Close               | Open              |
| Pressure                 | Close               | Open/middle open  |
| Table cross movement     | Advance             | Return            |
| Table R1 movement        | Movement to R1      |                   |
| Table R2 movement        | Movement to R2      |                   |
| Table R3 movement        | Movement to R3      |                   |
| Mandrel                  | Advance             | Retract/midstact  |
| Pressure boost           |                     | Retract           |
| Split die                | Close               | Open              |
| Kick                     | Forward             | Atward            |
| Mandrel assembly TYP1    | Advance             | Retract           |
| Mandrel assembly lock     | Lock                | Release           |
## 3. Key Data Points and Values
- **Feed**: Feed: 182.02
- **Plane**: Plane: 300.00
- **Bend**: Bend: 11.70
## 4. Document Structure
- **Header**: Step No.
- **Sections**:
  - STEP 1
  - STEP 2
  - Motion direction of drive parts
  - Note
## 5. Forms or Structured Data
- The document does not contain any explicit forms but includes structured data in the form of a table detailing the motion directions of various drive parts.
--- Page 60 (Azure OpenAI Vision) ---
# Extracted Information
## 1. Text Content
### THOSE WHICH ARE DRIVEN BY AC SERVO
Those which are driven by AC servo of [feed], [bend], and [plane] can be made motion, selecting data mode in JOG mode. In data mode, designate distance, angle and speed to move and make motion.
**JOG**
Push [Feed], [Bend], [Plane] button to display [JOG] or [DATA] button shown in the drawing. When you push [JOG] button, it changes to [DATA] and when you push [DATA] button, it changes to [JOG].
**When you move it with JOG**
If you make button display as JOG and select [Feed], [Bend], [Plane] and push [Move], [Remove] button, it moves to the respective direction in JOG mode.
**When you move it with DATA**
If you make button display as DATA, the place to input set amount and speed will be displayed. When you input the amount to be moved or angle there and input speed to be moved among 1~5 speed and push [Move], [Remove] button, it moves to the respective direction by set amount and set speed.
### THOSE WHICH CAN MAKE INCHING OPERATION
Chuck, clamp, pressure, mandrel, pressure, and boost can be moved by inching. And you can select whether you move it with inching or holding output for pressure and mandrel.
**Inching**
For the motion side and return side of [pressure], return side of [mandrel], you can select whether you move it with inching or move with output hole.
**In case of moving it by inching**
When you make the button display as inching and push [Move], [Remove] button, it moves to respective direction by inching.
**In case of making motion holding output**
When you make the button display as output holding, and push [Move], [Remove] button, it holds on output to the respective direction.
As for other drive parts, all move holding output.
### HOW TO TEACHING
For instance, before the bend of second process,
1. [clamp] → [motion side] → [memory]
2. [pressure] → [motion side] → [memory]
3. [mandrel] → [motion side] → [memory]
If you make teaching in this turn, when it becomes timing to handle before bend sequence area of 2nd process during auto operation,
1. Clamp close [CL CL]
2. Pressure close [PR CL]
3. Mandrel advance [MD FWD]
After motion of this turn then moves into next motion.
## 3. Key Data Points and Values
- JOG Value: 0
- JOG Speed: 5
- Modes: JOG, DATA, Inching, Output Holding
## 4. Document Structure
- **Header**: THOSE WHICH ARE DRIVEN BY AC SERVO
- **Sections**:
  - JOG
  - DATA
  - THOSE WHICH CAN MAKE INCHING OPERATION
  - HOW TO TEACHING
## 5. Forms or Structured Data
- Teaching Steps:
  1. [clamp] → [motion side] → [memory]
  2. [pressure] → [motion side] → [memory]
  3. [mandrel] → [motion side] → [memory]
  
- Auto Operation Steps:
  1. Clamp close [CL CL]
  2. Pressure close [PR CL]
  3. Mandrel advance [MD FWD]
--- Page 61 (Azure OpenAI Vision) ---
# Extracted Information from Document
## 1. Text Content
**WHEN YOU WANT TO MAKE SAME TIME HANDLING IN AUTOMATIC OPERATION.**  
When you want to make same time handling in automatic operation, [memory] button, after moving those to be moved at the same time. Those which are made teaching from the time of push of [memory] button to the time of next push of [memory] button are handled at the same time in automatic operation.
For instance, after bend of 2nd process.  
1. [clamp] → [return side] → [memory]  
2. [pressure] → [return side]  
3. [mandrel] → [return side] → [memory]
If teaching is done in this turn, when it comes to the timing to handle after bend sequence area during auto operation,  
1. Clamp open  
2. Pressure open, mandrel retract after motion of this turn, it moves to next motion. Max. 5 pieces motion can be done at the same time.
In this way, you can make teaching up to max. 20 steps.
**The method of teaching making use of PreSave button**  
In case of teaching making use of PreSave button, you can make some other motion halfway of feed, plane and bend motion.  
For example, assuming that present position of feed is 1000.00 [mm], make next teaching.  
1. [Feed] → 30 [mm] advance → [PreSave]  
2. [Feed] → 70 [mm] advance  
3. [Plane] → 180° [normal turn] → [Save]
If teaching is done in this order, the following editing sequence program will be created in the list of screen right side.  
1. FEED C 1000.00 (Feed motion C)  
2. WAIT FEED ≤ 970.00 (Feed present value comparison)  
3. PLANE A 180.00 (Plane motion A)
This becomes the content that, for the parts of feed motion C without completion check, after giving command to move feed by 100 mm, plane motion A 180° starts to move, if feed present position becomes less than 970.00 mm.
Assuming that feed present position 1000.00 [mm], plane present position 0.00 [mm], bend present position 45.00 [°], if you make the following teaching.  
1. [Feed] → 30 [mm] advance  
2. [Bend] → 15° [return → [PreSave]  
3. [Feed] → 70 [mm] advance  
4. [Bend] → return to 0°  
5. [Plane] → 180° [normal turn] → [Save]
If the teaching is done in this order, following editing sequence program will be created in the list of screen right side.  
1. FEED C 1000.00 (Feed motion C), BEND C -45.00 (Bend motion C)  
2. WAIT FEED ≤ 970.00 (Feed present position comparison), WAIT BEND ≤ 30.00 (Plane present position comparison)  
3. PLANE A 180.00 (Plane motion A)
It becomes the contents that, after giving command to move feed by 100 mm for the parts of feed motion C without completion check and to make bending by -45.00° for the parts of bend motion C also without completion check, plane motion A 180° starts to move, if feed present position becomes less than 970.00 mm and bend present position becomes less than 30°.
## 2. Tables
| Step | Description                          | Value         |
|------|--------------------------------------|---------------|
| 1    | FEED C                              | 1000.00      |
| 2    | WAIT FEED                           | ≤ 970.00     |
| 3    | PLANE A                             | 180.00       |
| 4    | BEND C                              | -45.00       |
| 5    | WAIT BEND                           | ≤ 30.00      |
## 3. Key Data Points and Values
- **Feed Present Position**: 1000.00 mm
- **Bend Present Position**: 45.00°
- **Plane Present Position**: 180.00°
- **Wait Feed Condition**: ≤ 970.00
- **Wait Bend Condition**: ≤ 30.00
## 4. Document Structure
- **Title**: WHEN YOU WANT TO MAKE SAME TIME HANDLING IN AUTOMATIC OPERATION.
- **Sections**:
  - Introduction to same time handling
  - Example of teaching sequence
  - Method of teaching using PreSave button
  - Example of editing sequence program
## 5. Forms or Structured Data
- **Teaching Steps**:
  1. [Feed] → 30 [mm] advance
  2. [Bend] → 15° [return] → [PreSave]
  3. [Feed] → 70 [mm] advance
  4. [Bend] → return to 0°
  5. [Plane] → 180° [normal turn] → [Save]
--- Page 62 (Azure OpenAI Vision) ---
# Extracted Information from Document Page
## 1. Text Content
Also teaching can be done combined with those which are driven by cylinder as under.  
Assuming that Feed present position 1000.00 [mm], Plane position 0.00 [°], Bend present position 45.00 [°], if you make the following teaching:  
1. [Feed]=30 [mm] advance  
2. [Chuck]=[Move]=[PreSave]  
3. [Feed]=70 [mm] advance  
4. [Mandrel]=[Move]=[Avel]
If the teaching is done in this order, following editing sequence program will be created in the list of screen right side.  
1. FEED C 100.0 (Feed motion C), Chuck close  
2. WAIT FEED ≤ 970.00 (Feed present position comparison)  
3. Mandrel advance
This becomes the content that, at the same time of chuck close motion, after giving command to move feed by 100 mm for the parts of feed motion C without completion check, mandrel starts to advance, if feed present position becomes less than 970.00 mm.
Explained as above, you can make some other motion halfway of feed, plane, bend motion and also you can make PreSave to 3 times.
## 2. Tables
| Command | Value | Used | Comment | Value | Speed | Command |
|---------|-------|------|---------|-------|-------|---------|
| 1. FEED C | 100.0 | 5.023 FEED C | 2 CH CL | 045 CHL |  |
| 2. WAIT FEED | ≤ 970.00 | 228 WAIT FEED |  |  |  |
| 3. MD FWD |  | 063 MD FWD |  |  |  |
## 3. Key Data Points and Values
- Feed present position: 1000.00 mm
- Plane position: 0.00 °
- Bend present position: 45.00 °
- Feed motion commands:
  - Feed C: 100.0
  - Wait Feed: ≤ 970.00
- Mandrel advance: unspecified value
## 4. Document Structure
- **Introduction**
  - Teaching with cylinder-driven mechanisms
- **Teaching Steps**
  - List of commands for teaching
- **Editing Sequence Program**
  - Description of the resulting program after teaching
- **Motion Explanation**
  - Explanation of motion commands and conditions
- **Steps for Operation**
  - Step 3: Push End after finish of operation
- **Insert/Delete Options**
  - Instructions for inserting, deleting, and editing programs
## 5. Forms or Structured Data
- **Insert**: Use this if you want to add motion between programs. If you push memory button, teaching result will be inserted.
- **Delete**: You can delete selected program. Select the place to be deleted and push button.
- **All Delete**: You can delete all programs which are displayed.
- **Editing**: You can edit selected program. Select the place to be edited and push button.
- **Cancel**: It finishes without storing teaching data.
--- Page 63 (Azure OpenAI Vision) ---
# Document Information Extraction
## 1. Text Content
### Completion
It finishes storing teaching data.  
Here, when canceling, completion of teaching is done, execution of re-start check is displayed. Push the following motion.
### Editing with Editing Sequence Parts Under Teaching
During teaching, you can edit programs using editing sequence parts. If you change tab from teaching to editing sequence, editing sequence parts list will be displayed. You can edit from there.  
After start of teaching, however, you cannot change to editing sequence tab without pushing memory. The message that [It is still a teaching] will be displayed and changes to teaching tab forcefully. After you store it, change tab.
### Teaching Data
Since data which are created by teaching are stored in before bend sequence area, after bend sequence area respectively, you can make re-editing from editing sequence creating screen after teaching too.  
If teaching is done and stored in the state where editing sequence is stored beforehand in before bend sequence, after bend sequence, editing sequence which are stored beforehand are overwritten.
## 2. Tables
*No tables were present in the provided document page.*
## 3. Key Data Points and Values
- **Completion of Teaching**: Execution of re-start check is displayed.
- **Editing Sequence Parts**: Can be edited during teaching.
- **Teaching Data Storage**: Data is stored in before bend and after bend sequence areas.
## 4. Document Structure
- **Header**: Completion
- **Section 1**: Editing with Editing Sequence Parts Under Teaching
- **Section 2**: Teaching Data
## 5. Forms or Structured Data
*No forms or structured data were present in the provided document page.*
--- Page 64 (Azure OpenAI Vision) ---
# DATA MANAGEMENT Document Extraction
## 1. Text Content
- **Title:** DATA MANAGEMENT
- **Instructions:**
  - Copy of working file, move, left right symmetric bend calculation, reverse bend calculation and copy by item are done here.
  - Push this icon to change to data manage screen.
  
- **Copy of working file or move is executed:**
  - Select working file to copy from data reference frame.
  - Select working file of copy from first.
  
- **Drive Selection:**
  - Drive: c:
  - Folder: 
    - If push here, it displayed list of drive.
  
- **Explanation:**
  - Since working file data which bender main body has is in C drive, select C drive. If you want to copy working file which bender main body has, D drive. If you want to copy working file which is in removable disk such as USB memory. A drive is drive of floppy disk, but floppy is not recommended for outer memory media of this bender.
  
- **Folder Selection:**
  - Then select folder in which working file is. The folders which exist in selected drive are displayed. When you select C drive at drive selection, 10 pieces folders which bender has are displayed.
  - When you select other than C drive, if you want to select a folder in the folders, since directory is displayed at screen right side, please select there aimed folder.
  
- **Folder Display:**
  - When the folder is selected, the folder that exists in the folder is displayed.
  
- **File List Display:**
  - When you select folder, the working files in it are displayed as a list. You select working file to copy or to move from there.
  
- **File List Example:**
  - File
    - 12345
    - abcde
    - test-1
  
- **Multiple File Selection:**
  - You can select multiple working files. The selected working files are inverted to blue color shown in the above picture. If you push the blue inverted working file again, the blue invert disappears and the selection is released.
  - When you push all selection button, it becomes the state that displayed working files are all selected. On the contrary, when you push all selection release button, the selected working files are all released.
  
- **After Selection:**
  - After you select working files to copy, move in data reference frame, select folder to copy, move to, in the frame of copy, move to.
  - In the same way, select drive and folder to copy, move. Working files which are kept in the selected folder are displayed in file display box.
  - Push copy button to copy and push move button to move.
  
- **Create New Folder:**
  - You can create new folder.
  - When you select outer drive other than C drive in copy, move to frame, new folder button becomes effective. When you push new folder button, soft key board will be displayed. You can create new folder in the selected folder with the name input from it.
## 2. Tables
### File List
| File   |
|--------|
| 12345  |
| abcde  |
| test-1 |
## 3. Key Data Points and Values
- **Drive Options:**
  - C Drive
  - D Drive
  - USB Memory
  - Floppy Disk (not recommended)
  
- **Folder Selection:**
  - Up to 10 folders displayed when C drive is selected.
  
- **File Selection:**
  - Example files: 12345, abcde, test-1
## 4. Document Structure
- **Header:** DATA MANAGEMENT
- **Sections:**
  - Copy of working file or move execution
  - Drive and Folder Selection
  - File List Display
  - Multiple File Selection
  - After Selection Instructions
  - Create New Folder
## 5. Forms or Structured Data
- **Drive Selection Form:**
  - Drive: [Dropdown]
  - Folder: [Dropdown]
  
- **File List Display:**
  - [List of files displayed]
  
- **New Folder Creation:**
  - Input field for new folder name.
--- Page 65 (Azure OpenAI Vision) ---
# Extracted Information from Document Page
## 1. All Text Content
### Copy together with folder
You can copy working files which bender has to outer memory media together with folder.  
Select C drive in data reference, and when you select outer drive other than C drive in copy, move to frame, folder copy button becomes effective. Push folder copy button to copy folder selected in data reference to the folder which was selected in copy, move to.
### Delete working file
You can delete working files selected in data reference frame with delete button. The selected working files are all deleted.
### LEFT RIGHT SYMMETRICAL BEND
Based upon the working file created, it creates working file which makes the product shape after pipe bend process to become left right symmetric one (plus and minus of plane becomes reversed).  
When left right symmetric bend data is created to new working file, the working specification data, jig information data, function data, pressure/pressure boost force-speed data, feed follow thrust data of original data are copied as it is. As for XYZ coordinate data, data that Z coordinate value of original data is Z reversed will be created.  
As for FPB data, following data will be copied:
- Pipe extended length, pipe whole length, bend start length, bend finish length, number of bends
- Pipe supply position and its speed
- Bend start position (feed, plane and feed corrective amount) and the speed
- Stop position, cross movement, mandrel, bend start position movement, bend original point position, plane rotation for loading (all supply conditions tab)
- Bend method, and process, last bend motion, repeat bending set value (all motion settings tab)
- Process feed speed, process feed amount, process feed corrective amount.
- Process plane speed, process plane amount, process plane corrective amount.
- Process bend speed, process bend amount, process bend corrective amount.
- Stop position
- PP
- PF
- Arc length
Push left right symmetric bend button to display left right symmetric bend screen.  
Select working file to be based in calculation origin, and input folder of calculate to and file name in calculation result frame.  
Push execute button to execute left right symmetric bend calculation, and to create new working file.
### REVERSE BEND CALCULATION
Based upon created working file, working file to make process from the reverse is created.  
Push reverse bend calculation button to display reverse bend calculation screen.  
Select working file to be based in calculation origin, and input folder of calculate to and file name in calculation result frame.  
Push execute button to execute reverse bend calculation, and to create new working file.  
When reverse bend calculation data is created to new working file, the working specification data, jig information data, function data, pressure/pressure boost force-speed data, feed follow thrust data of original data are copied as it is.  
As for XYZ coordinates data, data which is quite reverse order of original data is created.  
As for FPB data, process data are inverted to the data to bend from reverse (all data of ahead cross movement, before bend-after bend sequence, bend corrective amount return, each process detail 2 tab become initial value) and the following data are copied:
- Pipe supply position and the speed
- Bend start position speed
- Stop position, cross movement, mandrel, bend start position movement, bend original point position, plane rotation for loading (all supply conditions tab)
- Bend method, and process, last bend motion (all motion settings tab)
- Pipe total length, number of bends
## 2. Any Tables (Preserve Formatting)
No tables were present in the provided document content.
## 3. Key Data Points and Values
- **Left Right Symmetrical Bend Data:**
  - Pipe extended length
  - Pipe whole length
  - Bend start length
  - Bend finish length
  - Number of bends
  - Pipe supply position and speed
  - Bend start position (feed, plane, and feed corrective amount)
  - Stop position
  - Process feed speed
  - Process plane speed
  - Process bend speed
  - Arc length
- **Reverse Bend Calculation Data:**
  - Pipe supply position and speed
  - Bend start position speed
  - Pipe total length
  - Number of bends
## 4. Document Structure (Headers, Sections, etc.)
- **Copy together with folder**
- **Delete working file**
- **LEFT RIGHT SYMMETRICAL BEND**
- **REVERSE BEND CALCULATION**
## 5. Any Forms or Structured Data
No forms or structured data were present in the provided document content.
--- Page 66 (Azure OpenAI Vision) ---
# Extracted Information
## 1. Text Content
- Select working file of calculation origin to display bend start length and pipe extended length in calculation result frame. This display bend finish length of calculation origin as bend start length, and pipe extended length as pipe extended length as it is. Since bend start position of reverse bend calculation data is calculated from bend start length and pipe extended length displayed in this calculation result, and bend start length, pipe extended length and bend start position of calculation origin, please re-input them, if you correct it.
### PULL OUT THE USB DEVICE
- This bender recommends USB memory as outer memory media. When you pull out the USB memory abruptly from PC, it might happen that stored data disappear or, when you insert it to PC, PC does not recognize USB memory. Therefore please pull it out after following operation.
- Push "pull out the USB device" button to display the following screen.
- Since [USB 大容量記憶装置デバイス] item is already selected (if not selected, please select), push stop button (⏹) to display following screen.
- Push [OK] button to display message [USB 大容量記憶装置デバイスは安全に取り外すことができます。]. Please pull out the USB device after display of this message.
## 2. Tables
- No tables were present in the document.
## 3. Key Data Points and Values
- **USB Memory Recommendation**: Recommended as outer memory media.
- **Warning**: Abruptly pulling out USB may cause data loss.
- **Button Actions**:
  - "pull out the USB device"
  - "OK" button to confirm safe removal.
## 4. Document Structure
- **Header**: PULL OUT THE USB DEVICE
- **Sections**:
  - Introduction to USB memory usage.
  - Instructions for pulling out the USB device.
  - Screenshots and button actions.
## 5. Forms or Structured Data
- No forms or structured data were present in the document.
---
This structured output preserves the essential information from the document while organizing it for clarity.
--- Page 67 (Azure OpenAI Vision) ---
# Document Extraction and Structuring
## 1. Text Content
**ITEM BY ITEM COPY**  
Item by item copy is the function to copy individual data in the working file to other working file.
Select working file to copy from copy from frame.  
Select working file to copy from.
**Drive**  
**Folder**  
If push here, it displayed list of drive.
Since working file data which bender main body has is in C drive, select C drive, if you want to copy working file which bender main body has, D drive, if you want to copy working file which is in removable disk such as USB memory. A drive is drive of floppy disk, but floppy is not recommended for outer memory media of this bender.
Then select folder in which working file is. The folders which exist in selected drive are displayed. When you select C drive at drive selection, 10 pieces folders which bender has are displayed.  
When you select other than C drive, if you want to select folder in the folders, since directory is displayed at screen right side, please select there aimed folder.
When you select folder, the working files in it are displayed as a list in the file box. Please select working file to copy from it. Then select data to copy.
**File**  
12345  
**Data to**  
World:test-1
Please put check mark to items in the data frame to copy for the data which you want to copy. You can select multiple data.
After you select file and data to copy in copy from frame, you select working file of copy to in copy to frame.  
In the same way, select drive and folder. Since working files in the selected folder are displayed in file box, select working file of copy to among them.  
Push execute button to copy.
**Note:** You cannot make copy to over-write working file which is designated as No.1~No.5 of operation designation, move and item by item copy and move of working file which is operation designated.
---
## 2. Tables
| **File** | **Data to** |
|----------|-------------|
| 12345    | World:test-1|
---
## 3. Key Data Points and Values
- **Drive Selection**: C drive (for working file data)
- **Folder Selection**: Displayed based on selected drive
- **Working Files**: Displayed as a list in the file box
- **Data Frame**: Allows selection of multiple data items to copy
- **Note**: Cannot overwrite designated working files (No.1~No.5)
---
## 4. Document Structure
- **Header**: ITEM BY ITEM COPY
- **Sections**:
  - Introduction to item by item copy
  - Selection of working file and drive
  - Folder selection process
  - Display of working files
  - Data selection for copying
  - Execution of copy command
  - Note regarding overwriting restrictions
---
## 5. Forms or Structured Data
- **Selection Fields**:
  - Drive: [Dropdown]
  - Folder: [Dropdown]
  - File: [List]
  - Data to: [List]
- **Action Button**: Execute (to copy selected data)
---
This structured output preserves the original formatting and key information from the document.
--- Page 68 (Azure OpenAI Vision) ---
# Document Extraction and Structuring
## 1. Text Content
**Title:** EDITING SEQUENCE DATA COPY
You can make copy of sub-program of alarm history, production result history (daily report), parameter, servo parameter, editing sequence.
1. Copy of alarm history, production result history (daily report) can be done only copy to outer memory device. Put check to the items to be copied.
**Copy data selection**
- Select all
- Alarm history
- Production results record
Select drive to copy to.
- Drive: 
  - a: 
  - c: [PLX920W2K03]
  - d:
Working file which bender main body has is in C drive, since alarm history, production result history (daily report) can be copied only to outer memory device, it has no meaning to select bender main body (C drive) as copy to. Select D drive removable disk area such as USB memory.
If drive to copy to is decided, then select folder to copy to.
- bmp
- kb15
- kb30
- kbb50
- test_01
Push [execute] button to execute copy. Push [close] button to close editing sequence data copy screen.
## 2. Tables
| Drive | Folder         |
|-------|----------------|
| a:    |                |
| c:    | [PLX920W2K03]  |
| d:    |                |
| Folders to Copy To |
|---------------------|
| bmp                 |
| kb15                |
| kb30                |
| kbb50               |
| test_01             |
## 3. Key Data Points and Values
- **Copy Options:**
  - Alarm history
  - Production results record
- **Drive Options:**
  - a:
  - c: [PLX920W2K03]
  - d:
- **Folders Available:**
  - bmp
  - kb15
  - kb30
  - kbb50
  - test_01
## 4. Document Structure
- **Header:** EDITING SEQUENCE DATA COPY
- **Sections:**
  - Introduction to copying data
  - Copy data selection options
  - Drive selection
  - Folder selection
  - Execution of copy
## 5. Forms or Structured Data
- **Copy Data Selection:**
  - [ ] Select all
  - [ ] Alarm history
  - [ ] Production results record
- **Drive Selection:**
  - Drive: [ ] a: [ ] c: [PLX920W2K03] [ ] d:
- **Folder Selection:**
  - Touch twice continuously like double click to display folders in the folder.
- **Buttons:**
  - [execute]
  - [close]
--- Page 69 (Azure OpenAI Vision) ---
# Extracted Information from Document Page
## 1. Text Content
- You can make copy of parameter and servo parameter.
- Put check to the items to be copied.
- You can put check for all items at once.
- Push item to make yes/no of check.
- Since parameter and servo parameter which bender main body has are in C drive, if you want to copy from parameter and servo parameter which bender main body has, select drive C. If you make copy from removable disk such as USB memory, select drive D.
- When drive C is selected, it is not necessary to select folder to copy to (it is not possible to make selection).
- Then select drive and folder to copy to.
- If parameter and servo parameter exist in the folder of copy to, overwrite will be done to the relative data.
- Push [execute] button to execute copy. Push [close] button to close editing sequence data copy screen.
- You can make copy of sub-program of editing sequence.
- Put check to the items to be copied.
- Since editing sequence which bender main body has is in drive C, if you want to copy from what bender main body has, select drive C, if you want to copy which is in removable disk such as USB memory, select drive D.
- When drive C is selected, it is not necessary to select folder to copy to (it is not possible to make selection).
- If editing sequence data exists in the folder of copy to, overwrite will be done to the corresponding sub-program.
- Push [execute] button to execute copy. Push [close] button to close editing sequence data copy screen.
## 2. Tables
| Copy Data Selection         |                                   |
|-----------------------------|-----------------------------------|
| [ ] Select all              | You can put check for all items at once. |
| [ ] Setting of parameter     | Push item to make yes/no of check. |
| [ ] Setting of servo parameter|                                   |
| Select Drive of Copy From   |                                   |
|-----------------------------|-----------------------------------|
| Drive                       | [a:] [c:] [PLX920W2K03] [d:]     |
| Folder                      |                                   |
## 3. Key Data Points and Values
- Drive Options: a:, c:, [PLX920W2K03], d:
- Action Buttons: [execute], [close]
- Copying from Drive C: Necessary for parameter and servo parameters.
- Copying from removable disk: Select Drive D.
## 4. Document Structure
- **Section 2**
  - Copy of parameter and servo parameter
  - Copy data selection
  - Drive and folder selection
- **Section 3**
  - Copy of sub-program of editing sequence
  - Drive and folder selection
## 5. Forms or Structured Data
- **Copy Data Selection Form**
  - Options to select all, setting of parameter, and setting of servo parameter.
  
- **Drive Selection Form**
  - Options for selecting drive (a:, c:, [PLX920W2K03], d:) and folder.
This structured output preserves the content and formatting of the original document while organizing the information for clarity.
--- Page 70 (Azure OpenAI Vision) ---
# Document Extraction and Structuring
## 1. Text Content
You can copy sub-programs to other sub-programs.  
Select sub-program to copy from.  
Select sub-program of copy to, to copy to.  
Push [execute] button to execute copy. Push [close] button to close editing sequence data copy screen.
**Point:**  
You can make data of same content one more, if data is copied. It is a convenient function to store spare data. If important file is copied, you can check the content from copied data, when you delete data wrongly, or, after the change of content, if you want to see the original information. Also, if routine data is copied, you can create other data easily making use of copied data as a mode. Let’s copy data and make use of it for various purposes.
## 2. Tables
### How to Print Out Working File Data
| Working file | Working specification | Jg specification | Function | Pressure/Pressure boost force speed setting |
|--------------|-----------------------|------------------|----------|----------------------------------------------|
| XYZ          | FPB                   | Before bend*after bend sequence |          |                                              |
## 3. Key Data Points and Values
- **Sub-Programs Available:**
  - Sub-Program1
  - Sub-Program2
  - Sub-Program3
  - Sub-Program4
  - Sub-Program5
  - Sub-Program6
  - Sub-Program7
  - Sub-Program8
- **Printer Connection:**
  - Connect with commercial accessory cable.
## 4. Document Structure
- **Section 1:** Copying Sub-Programs
  - Instructions on copying sub-programs.
  - Important notes regarding data copying.
- **Section 2:** How to Print Out
  - Instructions on printing out working files.
  - Layout and connection details for printer.
## 5. Forms or Structured Data
- **Printer Connection Requirements:**
  - It is necessary to install driver software to be able to use the printer. Attention is required regarding the kind of driver. Drivers are available for various OS, and it is important to select the suitable driver for OS to avoid printing issues.
This structured extraction preserves the content and formatting of the original document while organizing the information clearly.
--- Page 71 (Azure OpenAI Vision) ---
## 3. Key Data Points and Values
- **Sub Programs**: 
  - Sub program 9
  - Sub program 10
- **Process Check**: 
  - Original point button OFF-ON
- **Production Status**: 
  - Production pieces clear
- **Auto Start**: 
  - Indicates the start of a process.
## 4. Document Structure
- **Header**: Pieces count output
- **Sections**:
  - Sub program 9
  - Sub program 10
  - Production pieces clear
  - Auto start
## 5. Forms or Structured Data
The document does not contain traditional forms or structured data but presents a flowchart that outlines processes and decision points.
---
This structured output preserves the flowchart's formatting and provides a clear overview of the document's content.
--- Page 109 (Azure OpenAI Vision) ---
# Document Extraction
## 1. Text Content
**PROCESS No.**  
When the program of before bend sequence, after bend sequence is created, you create the program of process which is shown here.
**CREATION OF CIRCUIT**  
Parts data which are used in editing sequence are shown in the parts list divided by the category.
**Select parts name or input parts No. and push Add to open circuit input window. Then input required set value. (Refer to details)**
**If your selection is not correct, push CANCEL. If input is correct, push OK.**
## 2. Tables
### Parts List Table
| Step No. | Command      | Value      | Speed      |
|----------|--------------|------------|------------|
| 1        | ON F5 50    | 213 GENERAL |            |
| 2        | OPT 1 OUT   | 206 OPT 1 OUT |          |
| 3        | WAIT IN X6C | 209 WAITING IN |          |
| 4        | TIM 03      | 201 TIMER  |            |
| 5        | OPT 1 BACK  | 297 OPT 1 BACK |        |
| 6        | WAIT IN X6C | 209 WAITING IN |          |
### Waiting Input Table
| Parts Input Line | Value |
|------------------|-------|
| Balancer 1       | 2.15  |
| Balancer 2       | 5.25  |
| Balancer 3       | 6.25  |
| Balancer 4       | 9.15  |
| Balancer 5       | 6.15  |
## 3. Key Data Points and Values
- **Parts List:**
  - Step 1: Command - ON F5 50, Value - 213 GENERAL
  - Step 2: Command - OPT 1 OUT, Value - 206 OPT 1 OUT
  - Step 3: Command - WAIT IN X6C, Value - 209 WAITING IN
  - Step 4: Command - TIM 03, Value - 201 TIMER
  - Step 5: Command - OPT 1 BACK, Value - 297 OPT 1 BACK
  - Step 6: Command - WAIT IN X6C, Value - 209 WAITING IN
- **Waiting Input Values:**
  - Balancer 1: 2.15
  - Balancer 2: 5.25
  - Balancer 3: 6.25
  - Balancer 4: 9.15
  - Balancer 5: 6.15
## 4. Document Structure
- **Header:**
  - PROCESS No.
- **Sections:**
  - CREATION OF CIRCUIT
  - Parts List
  - Waiting Input
## 5. Forms or Structured Data
- **Input Form:**
  - Parts Input Line: [Input Field]
  - Value: [Input Field]
  - Buttons: [SAVE] [CANCEL] [OK]
This structured output preserves the content and formatting of the original document while organizing the information clearly.
--- Page 110 (Azure OpenAI Vision) ---
# Document Extraction
## 1. Text Content
If you want to handle parts at the same time, select part to be handled at the same time from list of screen right side and, after inverting the part to blue, add new part.
In the state of above drawing, add new part. For instance, if you add the part of [clamp close], it becomes as above. By that, option 1 return and clamp close move at the same time. Parts up to max. 10 pieces can be handled at the same time.
### SORT
It is used when you intend to add motion in the program.
First select place to be inserted from list of screen right side.
In the state inverted to blue, add part to be inserted; if you insert, for instance, part of [pressure close], it becomes as above. By this, part of [pressure close] is inserted to the place of step No.4.
## 2. Tables
### Table 1: Command List for Handling Parts
| Command | Value      | Speed         |
|---------|------------|---------------|
| 1       | ON F 50   | 213 GENERAL F  |
| 2       | OPT 1 OUT | 096 OPT 1 OUT  |
| 3       | WAIT IN X6 | 209 WAITING IN  |
| 4       | TIM 03    | 201 TIMER      |
| 5       | OPT 1 BACK| 097 OPT 1 BAC  |
| 6       | WAIT IN X6 | 209 WAITING IN  |
### Table 2: Command List for SORT
| Command | Value      | Speed         |
|---------|------------|---------------|
| 1       | ON F 50   | 213 GENERAL F  |
| 2       | OPT 1 OUT | 096 OPT 1 OUT  |
| 3       | WAIT IN X6 | 209 WAITING IN  |
| 4       | TIM 03    | 201 TIMER      |
| 5       | OPT 1 BACK| 097 OPT 1 BAC  |
### Table 3: Command List After Inserting Pressure Close
| Command | Value      | Speed         |
|---------|------------|---------------|
| 1       | ON F 50   | 213 GENERAL F  |
| 2       | OPT 1 OUT | 096 OPT 1 OUT  |
| 3       | WAIT IN X6 | 209 WAITING IN  |
| 4       | PR CL     | 051 PR CL      |
| 5       | TIM 03    | 201 TIMER      |
| 6       | OPT 1 BACK| 097 OPT 1 BAC  |
## 3. Key Data Points and Values
- Maximum parts that can be handled at the same time: 10 pieces
- Commands include: ON F 50, OPT 1 OUT, WAIT IN X6, TIM 03, OPT 1 BACK, PR CL
- Speed values associated with commands vary (e.g., 213 GENERAL F, 096 OPT 1 OUT, etc.)
## 4. Document Structure
- Introduction to handling parts
- Explanation of the SORT function
- Step-by-step instructions for adding parts and inserting commands
- Tables illustrating command lists before and after modifications
## 5. Forms or Structured Data
- No explicit forms were identified in the document. The structured data is primarily in the form of tables listing commands, values, and speeds.
--- Page 111 (Azure OpenAI Vision) ---
# Document Extraction
## 1. Text Content
### DELETE
Select program to be deleted and push button.
Select part to be deleted from the list of screen right side. Here we delete part of [waiting input (AND)].
- If you push the list, it will invert to blue.
In the state inverted to blue, if you push (delete) button, it will be deleted.
### ALL DELETE
You can delete all programs which are displayed.
### EDITING
Select program to be edited and push button.
Select parts to be edited from the list of screen right side. We edit here parts of [General flag ON].
- If you push the list, it will invert to blue.
If you push [edit] button, in the state inverted to blue, circuit input window will appear. Then edit there.
### CANCEL
You can finish the created program without storage.
### COMPLETION
Created program is stored and finish.
---
## 2. Tables
### Table 1: DELETE Section
| Command | Value      | Spec        |
|---------|------------|-------------|
| 1       | ON F 50   | 213 GENERAL F |
| 2       | OPT 1 OUT | 096 OPT 1 OUT |
| 3       | PR CL     | 051 PR CL    |
| 4       | TIM 03    | 201 TIMER     |
### Table 2: EDITING Section
| Command | Value      | Spec        |
|---------|------------|-------------|
| 1       | ON F 50   | 213 GENERAL F |
| 2       | OPT 1 OUT | 096 OPT 1 OUT |
---
## 3. Key Data Points and Values
- **DELETE Section:**
  - Command 1: ON F 50 → Value: 213 GENERAL F
  - Command 2: OPT 1 OUT → Value: 096 OPT 1 OUT
  - Command 3: PR CL → Value: 051 PR CL
  - Command 4: TIM 03 → Value: 201 TIMER
- **EDITING Section:**
  - Command 1: ON F 50 → Value: 213 GENERAL F
  - Command 2: OPT 1 OUT → Value: 096 OPT 1 OUT
---
## 4. Document Structure
- **Headers:**
  - DELETE
  - ALL DELETE
  - EDITING
  - CANCEL
  - COMPLETION
- **Sections:**
  - Each header introduces a new section with specific instructions and information.
---
## 5. Forms or Structured Data
- The document does not contain any forms but includes structured data in the form of tables that outline commands, values, and specifications related to program deletion and editing.
--- Page 112 (Azure OpenAI Vision) ---
# Document Extraction and Structuring
## 1. Text Content
- **FLOW DISPLAY**
  - Created program is displayed in flow chart. If you put check in to make flow display, monitoring of motion condition is done. The place under working now is displayed in orange color.
  
- **SCALE-DOWN**
  - Flow chart display will be reduced.
  
- **SCALE-UP**
  - Flow chart display will be enlarged.
  
- **MAGNIFICATION**
  - Flow chart display will be magnified.
  
- **CHANGE**
  - Wordings on flow chart are changed into editing sequence mark or part name.
  
- **DEDICATED FLAG**
  - Detailed contents of 1~49 are displayed.
  
- **GENERAL FLAG**
  - Detailed contents of 50~99 are displayed. Since initial value has no comment, you can input comment by touching the number.
  
- **CLOSE**
  - It returns to editing sequence program create screen.
## 2. Tables
| Feature            | Description                                                                                     |
|--------------------|-------------------------------------------------------------------------------------------------|
| FLOW DISPLAY       | Created program is displayed in flow chart. If you put check in to make flow display, monitoring of motion condition is done. The place under working now is displayed in orange color. |
| SCALE-DOWN         | Flow chart display will be reduced.                                                             |
| SCALE-UP           | Flow chart display will be enlarged.                                                            |
| MAGNIFICATION      | Flow chart display will be magnified.                                                           |
| CHANGE             | Wordings on flow chart are changed into editing sequence mark or part name.                    |
| DEDICATED FLAG     | Detailed contents of 1~49 are displayed.                                                       |
| GENERAL FLAG       | Detailed contents of 50~99 are displayed. Since initial value has no comment, you can input comment by touching the number. |
| CLOSE              | It returns to editing sequence program create screen.                                          |
## 3. Key Data Points and Values
- **Flow Display**: Monitoring of motion condition is indicated by an orange color.
- **Scale Down**: Reduces flow chart display.
- **Scale Up**: Enlarges flow chart display.
- **Magnification**: Magnifies flow chart display.
- **Dedicated Flag**: Displays contents of 1~49.
- **General Flag**: Displays contents of 50~99, allows input of comments.
## 4. Document Structure
- **Header**: FLOW DISPLAY
- **Sections**:
  - FLOW DISPLAY
  - SCALE-DOWN
  - SCALE-UP
  - MAGNIFICATION
  - CHANGE
  - DEDICATED FLAG
  - GENERAL FLAG
  - CLOSE
## 5. Forms or Structured Data
- No specific forms or structured data were identified in the document. The content is primarily descriptive and instructional.
--- Page 113 (Azure OpenAI Vision) ---
# Extracted Information from Document Page
## 1. Text Content
- **ACTUATOR CONTROL DECLARATION**
## 2. Tables
| No  | Name              | Editing sequence part mark | Movement amount of each | Supplementary matter                                                                 |
|-----|-------------------|---------------------------|-------------------------|--------------------------------------------------------------------------------------|
| 071 | Auto start        | AUTO START                |                         |                                                                                      |
| 072 | Insert check      | P INSERT CHECK            |                         |                                                                                      |
| 073 | Count             | COUNT                     |                         | Pieces count up alarm occur (when it attains set number of pieces at count)         |
| 074 | Pipe supply position | MOVE SPL POS            |                         | Movement motion to pipe supply position                                               |
| 075 | Heat up valve ON  | HEET UP VALVE ON         | Output only             |                                                                                      |
| 076 | Heat up valve OFF | HEET UP VALVE OFF        | Output OFF only         |                                                                                      |
| 001 | Feed motion 1     | FEED 1                   |                         | Feed present position - pipe supply position                                          |
| 002 | Feed motion 2     | FEED 2                   |                         | Feed present position - bend start position                                           |
| 003 | Feed motion 3     | FEED 3                   |                         | Feed present position - machine total length position                                 |
| 004 | Feed motion 4     | FEED 4                   |                         | Process feed amount + process feed corrective amount                                   |
| 005 | Feed motion 5     | FEED 5                   |                         | Present position - (process feed amount + process feed corrective amount + length calculated before bend - actually chuck table moved amount) |
| 006 | Feed motion 6     | FEED 6                   |                         | Last process feed amount + last process feed corrective amount                        |
| 007 | Feed motion 7     | FEED 7                   |                         | Stopper CYL stroke - Mainly at the time of last process stopper bend, feed retract motion by stopper CYL stroke amount at bend motion preparation time |
| 008 | Feed motion 8     | FEED 8                   |                         | Mandrel CYL stroke - Mainly at the time of last process stopper bend, motion to retract feed by mandrel CYL stroke amount |
## 3. Key Data Points and Values
- **Auto Start**: AUTO START
- **Insert Check**: P INSERT CHECK
- **Count**: COUNT
- **Pipe Supply Position**: MOVE SPL POS
- **Heat Up Valve ON**: HEET UP VALVE ON
- **Heat Up Valve OFF**: HEET UP VALVE OFF
- **Feed Motions**:
  - Feed 1: FEED 1
  - Feed 2: FEED 2
  - Feed 3: FEED 3
  - Feed 4: FEED 4
  - Feed 5: FEED 5
  - Feed 6: FEED 6
  - Feed 7: FEED 7
  - Feed 8: FEED 8
## 4. Document Structure
- **Header**: ACTUATOR CONTROL DECLARATION
- **Sections**:
  - Auto Start
  - Insert Check
  - Count
  - Pipe Supply Position
  - Heat Up Valve ON
  - Heat Up Valve OFF
  - Feed Motions (1 to 8)
## 5. Forms or Structured Data
- The document does not contain any explicit forms but includes structured data in the form of a table detailing actuator control declarations and feed motions.
--- Page 114 (Azure OpenAI Vision) ---
# Document Information Extraction
## 1. Text Content
The document contains information related to various feed motions, detailing their editing sequence, movement amounts, and supplementary matters.
## 2. Tables
| No. | Name          | Editing sequence part mark | Movement amount of each axis                                                                 | Supplementary matter                                          |
|-----|---------------|----------------------------|---------------------------------------------------------------------------------------------|-------------------------------------------------------------|
| 009 | Feed motion 9 | FEED 9                     | Chuck close position value + standby point position value                                   | Movement from pipe supply position to standby point position. Chuck closes when it passes the chuck close position during movement. |
| 010 | Feed motion 10| FEED 10                    | Process feed amount + process feed corrective amount                                        | Feed retract motion at GP.                                   |
| 011 | Feed motion 11| FEED 11                    | Feed present position - pipe supply position                                                 | Feed motion at GP during next process change motion.         |
| 012 | Feed motion 12| FEED 12                    | Pipe supply position - feed present position + process feed amount + process feed corrective amount + chuck table actually moved amount | Feed motion with variable elongation correction at GP.       |
| 013 | Feed motion 13| FEED 13                    | Feed present position - process feed amount - process feed corrective amount - once advance amount | Feed motion at interruption 1 motion.                        |
| 014 | Feed motion 14| FEED 14                    | Feed present position - (process feed amount + process feed corrective amount + once advance amount + arc length calculated before bend - actually chuck table moved amount) | Feed motion with variable elongation correction at interruption 1 motion. |
| 015 | Feed motion 15| FEED 15                    | Feed present position + process feed amount + process feed corrective amount + once advance amount | Feed retract motion at GP and interruption 1 motion.        |
| 016 | Feed motion 16| FEED 16                    | Pipe supply position + process feed amount + process feed corrective amount + once advance amount + arc length calculated before bend - chuck table actually moved amount | Feed retract motion at GP and interruption 1 motion.        |
| 017 | Feed motion 17| FEED 17                    | Recapture advance amount                                                                     | Advance motion by recapture advance portion at interruption 4. |
## 3. Key Data Points and Values
- **Feed Motion Entries**: 009 to 017
- **Editing Sequence Part Marks**: FEED 9 to FEED 17
- **Movement Amounts**: Various calculations involving feed amounts, corrective amounts, and positions.
- **Supplementary Matters**: Descriptions of motions and conditions for each feed motion.
## 4. Document Structure
- **Headers**: 
  - No.
  - Name
  - Editing sequence part mark
  - Movement amount of each axis
  - Supplementary matter
- **Sections**: Each row represents a distinct feed motion with its respective details.
## 5. Forms or Structured Data
The table itself serves as a structured data format, detailing the feed motions and their respective parameters. There are no additional forms present in the document.
--- Page 115 (Azure OpenAI Vision) ---
# Extracted Information from Document Page
## 1. Text Content
The document appears to contain instructions or specifications related to feed and plane motions, including various parameters and descriptions of movements.
## 2. Tables
### Table of Feed and Plane Motions
| No  | Name          | Editing sequence part mark | Movement amount of each axis | Supplementary matter                                      |
|-----|---------------|----------------------------|------------------------------|----------------------------------------------------------|
| 018 | Feed motion 18| FEED 18                    | Once advance amount          | Retract motion by once advance amount portion at interruption 1. |
| 019 | Feed motion 19| FEED 19                    | Re-grip amount               | Retract motion by re-grip amount portion at interruption 2. |
| 020 | Feed motion 20| FEED 20                    | Recapture retract amount     | Retract motion by recapture retract amount portion at interruption 4. |
| 021 | Feed motion A | FEED A                     | Set arbitrarily              | Feed motion with arbitrarily designated speed by arbitrarily set amount portion. |
| 022 | Feed motion B | FEED B                     | Set arbitrarily              | Feed motion with arbitrarily designated speed by arbitrarily set position. |
| 023 | Feed motion C | FEED C                     | Set arbitrarily              | Feed motion with arbitrarily designated speed by arbitrarily set amount portion. |
| 024 | Feed motion D | FEED D                     | Set arbitrarily              | Feed motion with arbitrarily designated speed by arbitrarily set position. |
| 025 | Plane motion 1| PLANE 1                   | Movement to plane axis original point |                                                          |
| 026 | Plane motion 2| PLANE 2                   | Movement to plane angle at pipe input |                                                          |
| 027 | Plane motion 3| PLANE 3                   | Initial plane amount         | Movement motion by initial plane amount portion.          |
| 028 | Plane motion 4| PLANE 4                   | Process plane amount + process plane corrective amount | Plane motion to move next process.                        |
| 029 | Plane motion A | PLANE A                   | Set arbitrarily              | Plane motion with arbitrarily designated speed by arbitrarily set amount portion. |
| 030 | Plane motion B | PLANE B                   | Set arbitrarily              | Plane motion with arbitrarily designated speed by arbitrarily set position. |
| 031 | Plane motion C | PLANE C                   | Set arbitrarily              | Plane motion with arbitrarily designated speed by arbitrarily set amount portion. |
| 032 | Plane motion D | PLANE D                   | Set arbitrarily              | Plane motion with arbitrarily designated speed by arbitrarily set position. |
| 128 | Plane motion E | PLANE E                   | Set arbitrarily              | It makes plane motion by arbitrarily set amount portion, with arbitrarily designated speed. It stops plane motion at ON of arbitrary input No. |
## 3. Key Data Points and Values
- **Feed Motion Types**: 18, 19, 20, A, B, C, D
- **Plane Motion Types**: 1, 2, 3, 4, A, B, C, D, E
- **Movement Descriptions**: Various types of movements including advance, retract, re-grip, and arbitrary settings.
## 4. Document Structure
- **Sections**:
  - Feed Motions
  - Plane Motions
- **Headers**:
  - No
  - Name
  - Editing sequence part mark
  - Movement amount of each axis
  - Supplementary matter
## 5. Forms or Structured Data
The document does not appear to contain any forms or structured data beyond the table provided. The information is organized in a tabular format, which serves as the primary structured data representation.
--- Page 116 (Azure OpenAI Vision) ---
# Extracted Information from Document Page
## 1. Text Content
- Bend original point position - bend present position
- Process bend amount + process bend corrective amount
- Not available in main flow
- Bend target position - bend present position
- Process bend amount / 2 (3) + process bend corrective amount
- Bend axis 0° return motion
- Bend completion output OFF
- Bend return motion by process bend corrective amount portion, after completion of first bend at interruption 7, and at interruption 9.
- Bend motion with arbitrarily designated speed, by arbitrarily set amount portion.
- Outer chuck close PB ON wait.
- Pressure open → close
- Pressure mid → close
- Pressure → open
- Pressure → middle
- Pressure close → middle
## 2. Tables
| No  | Name          | Editing sequence part mark | Movement amount of each axis                          | Supplementary matter                                   |
|-----|---------------|----------------------------|------------------------------------------------------|-------------------------------------------------------|
| 033 | Bend motion 1 | BEND 1                     | Bend original point position - bend present position | Movement motion to bend original point position.      |
| 034 | Bend motion 2 | BEND 2                     | Process bend amount + process bend corrective amount | Without motion completion check                         |
| 035 | Bend motion 3 | BEND 3                     | Process bend amount + process bend corrective amount | Not available in main flow                             |
| 036 | Bend motion 4 | BEND 4                     | Segment bend amount                                   | Bend motion at segment bend.                           |
| 037 | Bend motion 5 | BEND 5                     | Bend target position - bend present position         | Bend motion at last segment bend.                      |
| 038 | Bend motion 6 | BEND 6                     | Process bend amount / 2 (3) + process bend corrective amount | First bend motion at interruption 7                  |
| 039 | Bend motion 7 | BEND 7                     | Bend present position - 0°                           | Bend axis 0° return motion.                           |
| 040 | Bend motion 8 | BEND 8                     | Bend prohibition amount                               | Bend motion at bend return prohibition.                |
| 041 | Bend motion 9 | BEND 9                     | Process bend corrective amount                        | Bend return motion by process bend corrective amount portion, after completion of first bend at interruption 7, and at interruption 9. |
| 042 | Bend motion A | BEND A                     | Set arbitrarily                                       | Bend motion with arbitrarily designated speed, by arbitrarily set amount portion. |
| 043 | Bend motion B | BEND B                     | Set arbitrarily                                       | Bend motion with arbitrarily designated speed to arbitrarily set position. |
| 044 | Bend motion C | BEND C                     | Set arbitrarily                                       | Bend motion with arbitrarily designated speed, by arbitrarily set amount portion. |
| 045 | Bend motion D | BEND D                     | Set arbitrarily                                       | Bend motion with arbitrarily designated speed to arbitrarily set position. |
| 046 | Chuck close   | CH CL                      |                                                      |                                                       |
| 047 | Chuck open    | CH OP                      |                                                      |                                                       |
| 048 | Outer chuck close | OUT IN CH CL          |                                                      | Outer chuck close PB ON wait.                         |
| 049 | Clamp close   | CL CL                      |                                                      |                                                       |
| 050 | Clamp open    | CL OP                      |                                                      |                                                       |
| 051 | Pressure close | PR CL                     |                                                      | Pressure open → close                                 |
| 052 | Pressure open  | PR OP                     |                                                      | Pressure mid → close                                  |
| 053 | Pressure mid close | PR MID CL           |                                                      | Pressure → open                                       |
| 054 | Pressure mid open | PR MID OP            |                                                      | Pressure close → middle                               |
## 3. Key Data Points and Values
- Bend motions: 1 to 9, A to D
- Movement amounts: Various amounts specified for each bend motion
- Supplementary matters: Specific instructions related to each bend motion
- Pressure states: Open, close, mid
## 4. Document Structure
- **Sections**: 
  - Bend motions (1-9, A-D)
  - Chuck operations (close/open)
  - Clamp operations (close/open)
  - Pressure operations (open/close/mid)
## 5. Forms or Structured Data
- The table itself serves as a structured data format, detailing the bend motions, their editing sequences, movement amounts, and supplementary matters.
--- Page 117 (Azure OpenAI Vision) ---
# Document Information Extraction
## 1. Text Content
- Pressure small open: If flag PR is set, do not make pressure mid open motion at next motion (within main flow).
- Die change motion 1: Without cross movement return motion. See step position of next process.
- Die change motion 2: Without cross movement return motion. See step position of present process.
- Mandrel retract: Before mandrel retract, it moves after check of feed present position.
- Mandrel middle retract: Before mandrel retract, it moves after check of feed present position.
- Pressure boost retract: 
- Split die close: 
- Split die open: 
- Kick forward: Only at KB selection.
- Kick aftward: Only at KB selection.
## 2. Tables
| No  | Name                        | Editing sequence part mark | Movement amount of each axis | Supplementary matter                                           |
|-----|-----------------------------|----------------------------|------------------------------|--------------------------------------------------------------|
| 055 | Pressure small open         | PR CHOT OP                 |                              | If flag PR is set, do not make pressure mid open motion at next motion (within main flow). |
| 056 | Die change motion 1         | TB CHG 1                   |                              | Without cross movement return motion. See step position of next process. |
| 057 | Die change motion 2         | TB CHG 2                   |                              | Without cross movement return motion. See step position of present process. |
| 058 | Table cross movement advance | TB FWD                     |                              |                                                              |
| 059 | Table cross movement return  | TB BWD                     |                              |                                                              |
| 060 | Table R1 movement           | MOVE TB R1                 |                              |                                                              |
| 061 | Table R2 movement           | MOVE TB R2                 |                              |                                                              |
| 062 | Table R3 movement           | MOVE TB R3                 |                              |                                                              |
| 063 | Mandrel advance             | MD FWD                     |                              |                                                              |
| 064 | Mandrel retract             | MD BWD                     |                              | Before mandrel retract, it moves after check of feed present position. |
| 065 | Mandrel middle retract       | MD MID BWD                 |                              | Before mandrel retract, it moves after check of feed present position. |
| 066 | Pressure boost retract       | PR BST BWD                 |                              |                                                              |
| 069 | Follow lock                 | FOL LOCK                   |                              |                                                              |
| 070 | Follow release              | FOL RLS                    |                              |                                                              |
| 077 | Mandrel oil supply          | MD SPL                     |                              |                                                              |
| 078 | Split die close             | CUT DAI CL                 |                              |                                                              |
| 079 | Split die open              | CUT DAI OP                 |                              |                                                              |
| 080 | Material positioning out     | PIP POS. OUT               |                              |                                                              |
| 081 | Material positioning return   | PIP POS. BACK              |                              |                                                              |
| 082 | Kick forward                | KICK FWD                   |                              | Only at KB selection.                                        |
| 083 | Kick aftward               | KICK BWD                   |                              | Only at KB selection.                                        |
| 084 | Mid supporter turn          | MID SPT TURN               |                              |                                                              |
| 085 | Mid supporter return        | MID SPT BACK               |                              |                                                              |
| 086 | Mid supporter up/sown escape | MID SPT REF ↔ R1 UP       |                              |                                                              |
| 087 | Mid supporter up/down escape | MID SPT REF ↔ R1 DOWN     |                              |                                                              |
| 088 | Mid supporter up/down R1    | MID SPT R1 ↔ R2 UP        |                              |                                                              |
| 089 | Mid supporter up/down R2    | MID SPT R1 ↔ R2 DOWN      |                              |                                                              |
## 3. Key Data Points and Values
- **Pressure small open**: PR CHOT OP
- **Die change motion 1**: TB CHG 1
- **Die change motion 2**: TB CHG 2
- **Mandrel retract**: MD BWD
- **Mandrel middle retract**: MD MID BWD
- **Pressure boost retract**: PR BST BWD
- **Follow lock**: FOL LOCK
- **Follow release**: FOL RLS
- **Mandrel oil supply**: MD SPL
- **Kick forward**: Only at KB selection.
- **Kick aftward**: Only at KB selection.
## 4. Document Structure
- **Sections**: 
  - Motion Commands
  - Table Movements
  - Mandrel Operations
  - Pressure Operations
  - Supporter Operations
## 5. Forms or Structured Data
- The document does not contain any explicit forms but includes structured data in the form of a table with defined columns and rows.
--- Page 118 (Azure OpenAI Vision) ---
# Document Information Extraction
## 1. Text Content
The document contains a list of editing sequences, movement amounts, and supplementary matters related to various operations.
## 2. Tables
The following table is extracted from the document:
| No  | Name                           | Editing sequence part mark | Movement amount of each axis | Supplementary matter |
|-----|--------------------------------|----------------------------|------------------------------|----------------------|
| 090 | Mid supporter up/down R2       | MID SPT R2 ⇔ R3 UP        |                              |                      |
| 091 | Mid supporter up/down R2       | MID SPT R2 ⇔ R3 DOWN      |                              |                      |
| 092 | Mandrel assembly TYP1 advance  | MD RUN TYP1 FWD           |                              |                      |
| 093 | Mandrel assembly TYP1 retract   | MD RUN TYP1 BWD           |                              |                      |
| 094 | Mandrel assembly lock          | MD RUN LOCK                |                              |                      |
| 095 | Mandrel assembly release       | MD RUN RLS                 |                              |                      |
| 096 | Option 1 out                  | OPT 1 OUT                  |                              |                      |
| 097 | Option 1 return               | OPT 1 BACK                 |                              |                      |
| 098 | Option 2 out                  | OPT 2 OUT                  |                              |                      |
| 099 | Option 2 return               | OPT 2 BACK                 |                              |                      |
| 100 | Lift TYP1 up                  | LIFT TYP1 UP               |                              |                      |
| 101 | Lift TYP1 down                | LIFT TYP1 DOWN             |                              |                      |
| 102 | Lift TYP2 operation           | LIFT TYP2 MOVE             |                              |                      |
| 103 | Lift TYP2 stop                | LIFT TYP2 STOP             |                              |                      |
| 104 | Magazine return                | ESC BACK                   |                              |                      |
| 105 | Bead detection operation       | BEAD DECT MOVE             |                              |                      |
| 106 | Bead detection stop           | BEAD DECT STOP             |                              |                      |
| 107 | Pusher out                    | PUSHER OUT                 |                              |                      |
| 108 | Pusher return                 | PUSHER BACK                |                              |                      |
| 109 | Guide advance                 | GUIDE FWD                  |                              |                      |
| 110 | Guide return                  | GUIDE BWD                  |                              |                      |
| 111 | Loader hand clamp             | SPL HAND CLAMP             |                              |                      |
| 112 | Loader hand unclamp           | SPL HAND UNCLAMP           |                              |                      |
| 113 | Loader hand turn              | SPL HAND TURN              |                              |                      |
| 114 | Loader hand turn return        | SPL HAND BACK              |                              |                      |
| 115 | Loader hand middle out         | SPL HAND MID OUT           |                              |                      |
| 116 | Loader hand middle return      | SPL HAND MID BACK          |                              |                      |
| 117 | Loader hand shift out          | SPL HAND SHIFT OUT         |                              |                      |
| 118 | Loader hand shift return       | SPL HAND SHIFT BACK        |                              |                      |
| 119 | Discharge hand turn out       | DIS HAND TURN OUT          |                              |                      |
| 120 | Discharge hand turn back      | DIS HAND TURN BACK         |                              |                      |
| 121 | Discharge hand unit advance    | DIS HAND UNIT FWD          |                              |                      |
| 122 | Discharge hand unit retract    | DIS HAND UNIT BWD          |                              |                      |
| 123 | Discharge hand unit down       | DIS HAND DOWN              |                              |                      |
## 3. Key Data Points and Values
- **Editing Sequences**: Various operations related to mandrel assembly, lifting, and discharging.
- **Movement Amounts**: Specific movements associated with each operation (not detailed in the table).
- **Supplementary Matters**: Not specified in the table.
## 4. Document Structure
- The document appears to be structured as a list of operations, each with a unique identifier (No), a name, an editing sequence, and associated movement amounts.
## 5. Forms or Structured Data
- The table itself serves as a structured data format, categorizing operations by their identifiers and descriptions. No additional forms were identified in the provided content.
This structured extraction preserves the original formatting and provides a clear overview of the document's contents.
--- Page 119 (Azure OpenAI Vision) ---
# Extracted Information
## 1. All Text Content
- Discharge hand up/down
- Discharge hand clamp
- Discharge hand unclamp
- TIMER • COUNTER OPERATION
- Timer
- Timer output
- Timer branch
- Waiting branch in/output
- Counter
- Counter reset
## 2. Tables
### Table 1: Discharge Operations
| No  | Name                     | Editing sequence part mark | Movement amount of each axis | Supplementary matter |
|-----|--------------------------|----------------------------|------------------------------|----------------------|
| 125 | Discharge hand up/down   | DIS HAND UP                |                              |                      |
| 126 | Discharge hand clamp      | DIS HAND CLAMP             |                              |                      |
| 127 | Discharge hand unclamp    | DIS HAND UNCLAMP           |                              |                      |
### Table 2: Timer and Counter Operations
| No  | Name                     | Command                                      | Argument          |
|-----|--------------------------|----------------------------------------------|-------------------|
| 201 | Timer                    | TIM ** ** . *                               | Timer value       |
| 202 | Timer output             | OUT Y ** ** TIM ** ** . * (E ** ** ** )    | Output No.        |
| 203 | Timer branch             | TIM ** ** . * LBL                           | Label No.         |
| 204 | Waiting branch in/output  | IF X ** ** TIM ** ** ON ** LBL (Y ** ** ) (OFF) | Label No.         |
| 205 | Counter                  | CNT # ** - ** - ** LBL                      | Counter No.       |
| 206 | Counter reset            | CNT RST # *                                 | Counter No.       |
## 3. Key Data Points and Values
- Timer Commands:
  - Timer value
  - Output No.
  - Alarm No.
  - Label No.
  - Counter No.
- Movement commands for discharge operations:
  - DIS HAND UP
  - DIS HAND CLAMP
  - DIS HAND UNCLAMP
## 4. Document Structure
- **Header**: TIMER • COUNTER OPERATION
- **Sections**:
  - Discharge Operations
  - Timer and Counter Operations
## 5. Forms or Structured Data
- No specific forms were identified in the document. The data is structured in tabular format as shown above.
--- Page 120 (Azure OpenAI Vision) ---
# Document Extraction and Structuring
## 1. Text Content
The document contains instructions related to flag operations in a system. Each operation is associated with a command and specific arguments.
## 2. Tables
### Flag Operation Table
| No  | Name                  | Command                                         | Argument        |
|-----|-----------------------|-------------------------------------------------|------------------|
| 207 | Output                | OUT Y * * * * * * * * * * * *                  | Output No.       |
|     |                       | E = * * * * * * * * * * * *                    | Alarm No.        |
|     |                       | It makes designated output (alarm) ON. Up to max. 5 pieces can be made ON at the same time. |                  |
| 208 | Output OFF            | OUT OFF Y * * * * * * * * * * * *              | Output No.       |
|     |                       | It makes designated output OFF. Up to max. 5 pieces can be made OFF at the same time. |                  |
| 209 | Waiting input (AND)   | WAIT IN X * * * * * * * * * * * *              | Input No.        |
|     |                       | It waits until designated input becomes ON. Up to max. 5 can be waited at the same time, and after all input become ON, move to handle next part. |                  |
| 210 | Waiting input (OR)    | WAIT IN X * * * * * * * * * * * *              | Input No.        |
|     |                       | It waits until any one of designated input becomes ON. Up to max. 5 can be waited at the same time. |                  |
| 211 | Output wait (AND)     | WAIT OUT Y * * * * * * * * * * * *              | Output No.       |
|     |                       | It waits until designated output becomes ON. Up to max. 5 can be waited at the same time and move to handle next part, after all output become ON. |                  |
| 212 | Output wait (OR)      | WAIT OUT Y * * * * * * * * * * * *              | Output No.       |
|     |                       | It waits until any one of designated output becomes ON. Up to max. 5 can be waited at the same time. |                  |
| 213 | General flag ON       | ON F * * * *                                    | General flag No. |
|     |                       | It makes designated general flag ON.            |                  |
| 214 | General flag OFF      | OFF F * * * *                                   | General flag No. |
|     |                       | It makes designated general flag OFF.           |                  |
| 215 | General flag input     | IF F * * ON THEN * LBL (OFF)                    | Label No.        |
|     |                       | When it pass this part, if designated general flag No. is ON (OFF), it jumps to designated label No. |                  |
| 216 | Dedicated flag ON      | ON F * * * *                                   | Dedicated flag No. |
|     |                       | It makes designated dedicated flag ON.          |                  |
| 217 | Dedicated flag OFF     | OFF F * * * *                                  | Dedicated flag No. |
|     |                       | It makes designated dedicated flag OFF.         |                  |
| 218 | Dedicated flag input    | IF F * * ON THEN * LBL (OFF)                   | Dedicated flag No. |
|     |                       | When it pass this part, if designated dedicated flag No. is ON (OFF), it jumps to designated label No. |                  |
| 231 | File flag branch       | IF F * * ON THEN * LBL (OFF)                   | Label No.        |
|     |                       | When it pass this part, if designated file flag No. is ON (OFF), it jumps to designated label No. |                  |
## 3. Key Data Points and Values
- Maximum pieces for output ON/OFF: 5
- Commands include: Output, Output OFF, Waiting input (AND/OR), Output wait (AND/OR), General flag ON/OFF, Dedicated flag ON/OFF, and File flag branch.
## 4. Document Structure
- **Section 1**: Output Operations
  - Commands related to output ON/OFF
- **Section 2**: Waiting Input Operations
  - Commands related to waiting for input signals
- **Section 3**: General Flags
  - Commands for managing general flags
- **Section 4**: Dedicated Flags
  - Commands for managing dedicated flags
- **Section 5**: File Flag Branch
  - Commands for managing file flags
## 5. Forms or Structured Data
No specific forms or structured data were identified in the document. The information is primarily presented in a tabular format.
--- Page 121 (Azure OpenAI Vision) ---
# Extracted Information from Document Page
## 1. Text Content
The document appears to be a reference guide for program control commands, detailing various commands, their descriptions, and associated arguments.
## 2. Tables
| No  | Name                       | Command                               | Argument                     |
|-----|----------------------------|---------------------------------------|------------------------------|
| 219 | Jump                       | GOTO ** LBL                           | Label No.                    |
|     |                            | It jumps to designated label No.      | It jumps within an area.     |
|     |                            | ** LBL                                | Label No.                    |
| 220 | Jump to                    | Jump to jump command.                | Labels are up to max. 99.    |
|     |                            | GOTO MAIN FC ** **                   | Function No.                 |
| 221 | Goto main jump             | It jumps to function No. of main seq.| Function No. is up to max. 255. |
| 222 | In/output branch           | IF X ** ** ON THEN ** LBL            | Input No.                    |
|     |                            | (Y ** **)(OFF)                       | Output No.                   |
|     |                            | Label No.                            |                              |
| 223 | Option branch              | IF OP ** ON THEN ** LBL              | Option No.                   |
|     |                            | (OFF)                                 | Label No.                    |
| 224 | Program branch             | IF PRG ** ON THEN ** LBL             | Program No.                  |
|     |                            | (OFF)                                 | Label No.                    |
| 225 | Main stop                  | MAIN STOP ** ** **                   | Function No.                 |
|     |                            | After handing off function No. which | designated by main sequence,  |
|     |                            | it gives command to temporarily stop  | main sequence. Main sequence  |
|     |                            | will temporarily stop after completion| of handling designated function No. |
| 226 | Main restart               | MAIN RESTART                          | Function No.                 |
|     |                            | Re-start of main sequence which stops | temporarily.                  |
| 227 | Main wait                  | MEIN WAIT ** ** **                   | Function No.                 |
|     |                            | Editing sequence stops temporarily,   | and at the same time when    |
|     |                            | main sequence starts to handle        | designated function No.,      |
|     |                            | editing sequence also starts again.   |                              |
| 228 | Feed present position      | WAIT FEED (=, ≤, ≥) ** **            | Comparison sign              |
|     | comparison                 | When the present position of feed     | becomes it within the set range, |
|     |                            | it shifts to the processing of        | the following parts.         |
| 229 | Plane present position     | WAIT PLANE (=, ≤, ≥) ** **           | Comparison sign              |
|     | comparison                 | When the present position of plane    | becomes it within the set range, |
|     |                            | it shifts to the processing of        | the following parts.         |
| 230 | Bend present position      | WAIT BEND (=, ≤, ≥) ** **            | Comparison sign              |
|     | comparison                 | When the present position of bend     | becomes it within the set range, |
|     |                            | it shifts to the processing of        | the following parts.         |
## 3. Key Data Points and Values
- Maximum labels for jump commands: 99
- Maximum function numbers: 255
- Various commands related to program control including jump, wait, and branch commands.
## 4. Document Structure
- **Section Title**: PROGRAM CONTROL
- **Table of Commands**: Contains columns for No, Name, Command, and Argument.
## 5. Forms or Structured Data
No specific forms or structured data were identified in the document. The information is primarily presented in a tabular format.
--- Page 122 (Azure OpenAI Vision) ---
# Document Extraction and Structuring
## 1. All Text Content
**DEDICATED • GENERAL FLAG**
**DEDICATED FLAG**  
It means the flag which is used in main sequence. Although dedicated flags can be made ON/OFF arbitrarily, it might cause trouble for the normal motion of bender. Therefore be careful for the handling of flag.
## 2. Tables
| Dedicated Flag No. | Dedicated Flag Name                     | Summary                                                                                                   |
|---------------------|-----------------------------------------|-----------------------------------------------------------------------------------------------------------|
| 1                   | Chuck close permit flag                 | During motion of feed motion 9, this flag becomes ON, when it pass the chuck close position.              |
| 2                   | Process flag just before the last process. | During auto operation, this flag becomes ON, when it comes to the process just before the last process.   |
| 3                   | Last process flag                       | During auto operation, this flag becomes ON, when it comes to last process.                               |
| 4                   | Bend motion completion flag             | It becomes ON, when bend motion of each process complete.                                                 |
| 5                   | Pipe supporter up/down motion permit flag. | Not used yet.                                                                                              |
| 6                   | Mid supporter turn permit flag          | Not used yet.                                                                                              |
| 7                   | Safety mat alarm detection prohibition flag | While this flag is ON, it does not raise alarm, even if safety mat is stepped ON.                         |
| 8                   | Clamp - pressure close permit flag 1    | When you use type KBB-70 bender, you cannot close clamp - pressure, unless this flag is ON.              |
| 9                   | Clamp - pressure close permit flag 2    | When you use type KBB-70 bender and mandrel device, you cannot close clamp - pressure, unless this flag is also ON, as well as clamp - pressure close permit flag 1. |
| 10                  | Table up/down permit flag 1             | When you use type KBB-70 bender, you cannot make up/down of table, unless this flag is ON.                |
| 11                  | Table up/down permit flag 2             | When you use type KBB-70 bender and mandrel device, you cannot make up/down of table, unless this flag is also ON as well as table up/down permit flag 1. |
| 12                  | Mandrel middle retract flag              | When mandrel middle retract motion is done, this flag becomes ON.                                        |
| 13                  | Flag F                                  | When feed motion at the time of next process change motion (FcNo.063) completes, this flag becomes ON. However, at the time of once forward motion, temporary advance motion, it becomes ON after completion of first feed motion. |
| 14                  | Flag P                                  | When plane motion at the time of next process change motion (FcNo.063) completes, this flag becomes ON.   |
| 15                  | Flag B                                  | When bend return motion at the time of next process change motion (FcNo.063) completes, this flag becomes ON. However, if bend back prohibition in process of bend back prohibition motion is ON setting, this flag becomes ON without completion of bend return. |
| 16                  | Flag C                                  | This flag becomes ON, when de change motion at the time of next process change motion completes.           |
| 17                  | Flag PR                                 | Not used yet.                                                                                              |
| 18                  | Pieces count up flag 1                  | This flag becomes ON, when pieces count-up.                                                               |
| 19                  | Pieces count up flag 2                  | When count-up stop method of plural operation designation is 1 CH, this flag becomes ON, if pieces count-up. |
## 3. Key Data Points and Values
- **Dedicated Flag No.**: Ranges from 1 to 19.
- **Flags Not Used Yet**: 5, 6, 17.
- **Flags with Specific Conditions**: 
  - Flag 7 does not raise alarm when ON.
  - Flags 8 and 9 relate to clamp pressure conditions.
  - Flags 10 and 11 relate to table up/down conditions.
## 4. Document Structure
- **Title**: DEDICATED • GENERAL FLAG
- **Section**: DEDICATED FLAG
- **Description**: Explanation of the purpose and handling of dedicated flags.
## 5. Forms or Structured Data
- There are no forms or structured data present in the document. The information is presented in a tabular format.
--- Page 123 (Azure OpenAI Vision) ---
# Extracted Information
## 1. All Text Content
- **Dedicated Flag No.**
  - 20 Last process start output flag: This flag becomes ON, when last process starts.
  - 21 Abnormal condition occur flag: This flag becomes ON, if alarm is raised.
  - 22 Flag C2: This flag becomes ON at the time of feed, plane, bend return motion after last process bend of close bend 1, 2. If cross movement is ON set, it becomes ON after completion of table cross movement advance motion.
  - 23 Pipe supply position flag: This flag becomes ON, when it is in the state of pipe supply position.
  - 24 Delivery stop flag: When feeder is used, this flag moves the motion condition of feeder to original position side, when automatic operation finish.
  - 25 Flag OCH1: When outer article number input is done, this flag becomes ON, if article No. is designated from outside and data reading-in is completed.
  - 26 Flag OCH2: When outer article number input is done, this flag becomes ON, if the data designated from outside is open bend and, in case of PB selection, data reading-in is completed.
  - 27 Flag C3: When angular pipe which functions at the time of pipe supply position motion is Yes, this flag becomes ON at table cross movement advance position.
  - 28 Once forward flag: When once forward of each process of FPB is ON, this flag becomes ON, after making feed motion for set amount portion.
  - 27–49 Empty
- As for dedicated flag, software producer defines the flag arbitrarily. Parameter set screen to add parts of dedicated flag ON, dedicated flag OFF, dedicated flag input. If you push [FLG] button, dedicated flag list will be displayed.
## GENERAL FLAG
- General flag is the flag which user defines it freely.
  - **General Flag No.**: 50–99
  - **General Flag Name**: General flag 50–99 (you can change name on the screen)
You can add comment to general flag too. This is parameter set screen, when parts of general flag ON, general flag OFF, general flag input are added. If you push [FLG] button, general flag list will be displayed. When you push comment part of general flag No. to be input, soft keyboard will be displayed. You can input comment from there.
---
## 2. Tables
### Dedicated Flags Table
| Dedicated Flag No. | Dedicated Flag Name                | Summary                                                                                                           |
|---------------------|------------------------------------|-------------------------------------------------------------------------------------------------------------------|
| 20                  | Last process start output flag     | This flag becomes ON, when last process starts.                                                                  |
| 21                  | Abnormal condition occur flag      | This flag becomes ON, if alarm is raised.                                                                        |
| 22                  | Flag C2                           | This flag becomes ON at the time of feed, plane, bend return motion after last process bend of close bend 1, 2. If cross movement is ON set, it becomes ON after completion of table cross movement advance motion. |
| 23                  | Pipe supply position flag          | This flag becomes ON, when it is in the state of pipe supply position.                                           |
| 24                  | Delivery stop flag                 | When feeder is used, this flag moves the motion condition of feeder to original position side, when automatic operation finish. |
| 25                  | Flag OCH1                          | When outer article number input is done, this flag becomes ON, if article No. is designated from outside and data reading-in is completed. |
| 26                  | Flag OCH2                          | When outer article number input is done, this flag becomes ON, if the data designated from outside is open bend and, in case of PB selection, data reading-in is completed. |
| 27                  | Flag C3                            | When angular pipe which functions at the time of pipe supply position motion is Yes, this flag becomes ON at table cross movement advance position. |
| 28                  | Once forward flag                  | When once forward of each process of FPB is ON, this flag becomes ON, after making feed motion for set amount portion. |
| 27–49               | Empty                              |                                                                                                                   |
### General Flags Table
| General Flag No. | General Flag Name                                   |
|-------------------|-----------------------------------------------------|
| 50–99             | General flag 50–99 (you can change name on the screen) |
---
## 3. Key Data Points and Values
- **Dedicated Flags**: 20 to 28 (with 27-49 being empty)
- **General Flags**: 50 to 99
---
## 4. Document Structure
- **Sections**:
  - Dedicated Flags
  - General Flags
---
## 5. Forms or Structured Data
- No specific forms were identified in the document. The data is presented in tabular format.
--- Page 124 (Azure OpenAI Vision) ---
It appears that the document you provided is blank, as there is no visible text, tables, or any other content. Therefore, I am unable to extract or structure any information from it. If you have another document or specific content you would like me to analyze, please provide that, and I'll be happy to assist!
Document 2. Machine_Safety_Rev12:
Machine Safety – Document 03-010 Rev 12 (Sept 2025)
 Page 1 of 28 
    
    
Title: Machine Safety  Doc. No./ 
Version:  03-010 
Rev 1 2 Date: Sept  2025  
Function / Organization:  Author(s):  Functional Owner:  
Environment, Health, & Safety  J. Raymond, D. Wolf, S. Lopez, G. 
Gray, Ryan Bethel  Mary Betsch  
 
 
TABLE OF CONTENTS  
1.0 Purpose  
2.0 Scope  
3.0 Machine Guarding Assessments  
4.0 Minimal Machine Safeguarding Requirements  
5.0 Metal and Wood Saws  
6.0 Lathes  
7.0 Pipe Bending, Forming, Threading Machines  
8.0 Drill Presses  
9.0 Hydraulic Presses  
10.0 Balancing Machines  
11.0 Grinding Machines and Pedestal or Bench -Mounted Grinders  
12.0 Brake Presses  
13.0 Milling, Drilling and Boring Machines  
14.0 Roll Forming and Roll Bending Machines  
15.0 Rubber and Plastic Mill Machines  
16.0 Belt Sanders  
17.0 Vertical Turret Lathe  
18.0 Metal Shears  
19.0 Plasma and Water Jet Cutting Machine  
20.0 Laser Machine  
21.0 Training  
22.0 Document and Record Retention  
23.0 Program Review  
24.0 Definitions  
 
1.0 PURPOSE  
This Standard provides the definitions and procedures that must be used by all Ingersoll Rand 
Operations in defining and managing machine guarding and general machine safety.  Ingersoll 

 Page 2 of 28 
    
    
Title: Machine Safety  Doc. No./ 
Version:  03-010 
Rev 1 2 Date: Sept  2025  
Function / Organization:  Author(s):  Functional Owner:  
Environment, Health, & Safety  J. Raymond, D. Wolf, S. Lopez, G. 
Gray, Ryan Bethel  Mary Betsch  
 
Rand employees interact with a wide variety of machines daily, and full implementation of this 
Standard is necessary to protect against hazards inherent in machinery.  
2.0 SCOPE  
2.1 This Standard applies to all Ingersoll Rand owned or leased locations.  
2.2 Service Technicians & contractors will only use customer/vendor machinery if they have 
been previously trained in the use of that particular machinery, i.e. lifting, hydraulic 
torquing, machining, welding, and the condition of the machinery is determined to be 
safe for use.  
2.3 This document aims to reduce risks to people's health and safety from equipment 
provided for use at work. This is aimed at but not limited to the following; Lathes, 
pedestal drills, handling dies, vertical boring machine, milling machines, fabricating 
equipment, and hydraulic pullers.  When using rotating equipment, gloves should never 
be worn.  Proper PPE should be worn when using equipment according to the risk 
assessment.  When operating rotating equipment, gloves and loose clothing should 
never be w orn.  Prohibit employees working with or near machines from wearing loose 
clothing or jewelry and require securing long hair from inadvertently entering the point of 
operation.  
2.4 In general, this document requires that any equipment provided for use at work is:  
2.1.1  Used for its intended purpose according to the equipment manufacturer and for 
the working conditions.  
2.2.1 Safe for use.  
2.3.1 Maintained in a safe state of rep air to ensure that people's health and safety is not 
exposed to risk.  
2.4.1 Regularly inspected by a competent person to ensure that the equipment 
continues to be safe for use.  
2.5.1 Fitted with all necessary suitable safety measures or protective devices such as 
guarding, protection devices, markings, warning devices, emergency stops and 
personal protective equipment.  
2.6.1 Implementation of procedural measures such as safe systems of work, should be 
provided for use to persons who have received adequate information, instruction 
and training in the equipment's operation/use.  
2.7.1 Anchored to prevent walking or moving.  
2.5 Where local regulations are more stringent than this requirement, those regulations 
supersede this requirement. In the absence of regulatory specific guidance and where 
the guidance is less protective than that provided by this document, the Ingersoll Ran d 
requirements must be followed.  

 Page 3 of 28 
    
    
Title: Machine Safety  Doc. No./ 
Version:  03-010 
Rev 1 2 Date: Sept  2025  
Function / Organization:  Author(s):  Functional Owner:  
Environment, Health, & Safety  J. Raymond, D. Wolf, S. Lopez, G. 
Gray, Ryan Bethel  Mary Betsch  
 
2.6 The Business Unit EHS Leader/VP Sustainability, Site EHS Leader and Site  Leader (eg 
plant manager) together may exclude equipment from these requirements based upon a 
risk assessment. Documentation of review and the decision must be maintained at the 
site or in Gensuite ATS.  
3.0 MACHINE GUARDING ASSESSMENTS  
3.1 A formal documented hazard evaluation and risk assessment must be completed for 
each machine at the location.  
3.1.1 A Risk Assessment form categorized by low, med, high and extra high risk should 
be used when completing a machine guarding risk assessment and should be 
correlated to the performance level or category risk scoring below:  
Risk Assessment Score  Performance Level  Category  
N/A Pla Category B  
Low Risk: 1 -3 PLb: Low  Category 1  
Moderate Risk: 4 -6 PLc:  Moderate  Category 2  
High Risk: 7 -9 PLd: High  Category 3  
Very High Risk: 10+  Ple: Very High  Category 4  
 
3.2.1 Safety systems and/or control reliable systems should be installed according to 
the performance level or category type.  
3.3.1 A Corrective Action Plan shall be developed and prioritized for any deficiencies 
identified in safeguarding systems on any machine.  A schedule for corrective 
actions shall be established.  Supplemental safety actions shall be implemented 
until corrective  actions are completed.  
3.4.1 A new assessment shall be completed when any machine or machining system I
 s modified or moved.   
4.0 MINIMAL MACHINE SAFEGUARDING REQUIREMENTS  
4.1 One or more methods of machine safeguarding shall be provided to protect the operator 
and other employees in the machine area from hazards such as those created by point 
of operation, in running nip points, rotating parts, flying chips and sparks, and any  other 
access doors where hazards may exist. Examples of guarding methods are - barrier 
guards, two -hand tripping devices, presence sensing devices, etc.  In cases where it is 
not possible to guard the actual point of operation, such as a pedestal grind er, then other 
administrative methods shall be employed.   
4.2 Guards shall be affixed to the machine where possible and secured elsewhere if for any 
reason attachment to the machine is not possible. The guard shall be such that it does 
not create an accident hazard in itself.  

 Page 4 of 28 
    
    
Title: Machine Safety  Doc. No./ 
Version:  03-010 
Rev 1 2 Date: Sept  2025  
Function / Organization:  Author(s):  Functional Owner:  
Environment, Health, & Safety  J. Raymond, D. Wolf, S. Lopez, G. 
Gray, Ryan Bethel  Mary Betsch  
 
4.3 The point of operation of machines (the area on a machine where work is actually 
performed upon the material being processed) whose operation exposes an employee to 
injury, shall be safeguarded. The safeguarding device shall be in conformity with any 
appropriate local or country -specific standards or, in the absence of applicable specific 
standards, shall be so designed and constructed as to prevent the operator from having 
any part of his body in the danger zone during the operating cycle.  
4.4 For CNC automated machines where hard guards do not eliminate all risk, presence -
sensing devices or interlocks shall be installed to prevent access to any hazardous 
movement. When Point of Operation access doors are opened, the presence sensing 
device sha ll cause the machine operation to stop.  Additionally, the presence sensing 
device shall not allow starting machining operation while access doors are open.   
4.5 Special hand tools for placing and removing material shall be such as to permit easy 
handling of material without the operator placing a hand in the danger zone.  Such tools 
(e.g. tongs and push sticks) shall not be in lieu of other guarding, but can only  be used to 
supplement protection provided.  
4.6 Machine controls shall include safety circuitry with the appropriate Performance Level 
(PL), identified through a risk assessment, to stop hazards after a stop signal is issued 
by a detection device such as an emergency stop.   
4.7 An anti -restart device shall be in place on each machine to prevent automatic start -up of 
a machine after a power interruption.  
4.8 Pull back and restraint devices are prohibited.  
4.9 Safeguarding systems shall be included in routine safety inspection processes, and in 
preventive and predictive maintenance programs as defined by the original equipment 
manufacturers (OEM) recommendations and industry standards.  
4.10 Machine operators shall conduct a visual inspection of the applicable guarding systems 
and conduct function testing of electronic safeguarding systems (such as light curtains) 
at the beginning of each shift or prior to operation if the machine is used les s than daily 
in accordance with manufacturer’s recommendations to determine if they are working 
properly.   
4.11 When the inspection indicates a safeguarding deficiency, the equipment shall be 
removed from service until the deficiency is corrected.  
4.12 No employee, contractor or visitor at an Ingersoll Rand location shall, at any time 
bypass, modify or remove and safeguards including, but not limited to interlocks, light 
curtains, emergency stops and controls.   
4.13  Machine operators shall notify the supervisor if any safeguards have been bypassed, 
modified or removed.  The machine shall not be operated until proper safeguarding has 
been restored.   

 Page 5 of 28 
    
    
Title: Machine Safety  Doc. No./ 
Version:  03-010 
Rev 1 2 Date: Sept  2025  
Function / Organization:  Author(s):  Functional Owner:  
Environment, Health, & Safety  J. Raymond, D. Wolf, S. Lopez, G. 
Gray, Ryan Bethel  Mary Betsch  
 
4.14 Point of Operation guarding is mandatory and must include at least two safety 
protections for equipment based on the machine guarding risk assessment, or is 
mandated by a specific standard.  
4.14.1 A safety -rated mechanism must be in place to stop equipment after a stop signal 
is issued by a detection device. Safeguarding devices must be integrated into the 
machine’s function via the appropriate machine safety -rated controls (PLC).  
4.15 Emergency stops must be in place and adequate in number and placement to provide 
emergency stopping capability under all foreseeable emergency scenarios.  
4.16 Safeguarding systems must be included in routine safety inspection processes, and in 
preventive and predictive maintenance programs as defined by the original equipment 
manufacturers (OEM) recommendations and industry standards.  
4.18 Functional testing of safeguarding devices, including safe distance calculations must be 
completed in accordance with the manufacturer's recommendations and documented in 
Gensuite Compliance Calendar or site PM system.  
4.19 All machinery shall be securely mounted on the floor or placed on anti -vibration devices 
(whichever is required or recommended per the manufacturer of the equipment).  
4.20 No employee, contractor or visitor, at an Ingersoll Rand location shall, at any time 
bypass or remove any safeguards including, but not limited to interlocks, limit switches, 
light curtains, emergency stops, and controls.  
4.21 Machine safeguarding and functional testing shall be included in the Operation’s routine 
EHS inspection process and must be documented.  
4.21.1 Ensure the Operation’s corrective action program specifically references 
unauthorized removal or bypass of any safeguards required by Ingersoll Rand or 
the OEM.  
4.21.2 Any functional defect in the safeguard requires immediately stoppage of the 
affected equipment until the devices have been corrected and confirmed to be 
properly operating.  
4.22 When parts are stacked at the point of use they should not create a potential hazard 
interfering with machine guarding.  
5.0 METAL AND WOOD SAWS  
5.1 For all woodworking equipment, where injury may result if motors were to restart after 
power failures, dropout/anti -restart protection must be in place to control voltage to all 
actuators (120V or less).  
5.2 Table Saws  

 Page 6 of 28 
    
    
Title: Machine Safety  Doc. No./ 
Version:  03-010 
Rev 1 2 Date: Sept  2025  
Function / Organization:  Author(s):  Functional Owner:  
Environment, Health, & Safety  J. Raymond, D. Wolf, S. Lopez, G. 
Gray, Ryan Bethel  Mary Betsch  
 
5.2.1 Enclose the area of the saw above the table with a self -adjusting guard. The 
guard must adjust to the thickness of the material being cut and remain in contact 
with it. Hinge the guard so that the blades can be changed easily.  
5.2.2 The Operator hand(s) must never be within the manufacturer danger zone (12” of 
the blade if the manufacturer has not defined the danger zone).  
5.3.3 For large -sized work, a second Operator may be required to handle the work 
piece (example ripping plywood).  
5.3.4 The preferred type of table saws include:  
• An “up cut saw” where the blade is fully protected by a moving guard during 
operation.  
• A “sawStop saw” with an automatic braking system that stops the blade upon 
contact with skin or flesh.  
5.3 Radial Arm and Chop Saws  
5.3.1 The upper half of the saw (from the blade down to the end of the saw arbor) must 
be enclosed with a fixed guard. The lower half must be guarded with a self -
adjusting, floating guard that rises and falls and automatically adjusts to the 
thickness of the st ock.  
5.3.2 An adjustable stop must be installed to limit forward travel distance of the blade 
during repeat cuts.  
5.3.3 Use of limit chains or other effective means (for example, extend the table edge) 
must be in place to prevent the saw from moving beyond the front or back edge 
of the table.  
5.4 Vertical and Horizontal Band Saws  
5.4.1 All saws must have adjustable or fixed blade guards to protect the user(s) from 
exposed blades.  
5.4.2 The blade guard must be properly in place.  The guard must fully cover the blade 
outside the cutting zone of the work area.  
5.4.3 A chip shield must always be in place to protect employees from flying debris. 
Shields must be maintained and clean at all times.  
5.4.4 All exposed mechanical power transmission apparatus (under 10’ or 3 meters 
from the floor or working platform) must be guarded.  
5.4.5 A readily available emergency stop must be in place.  
 

 Page 7 of 28 
    
    
Title: Machine Safety  Doc. No./ 
Version:  03-010 
Rev 1 2 Date: Sept  2025  
Function / Organization:  Author(s):  Functional Owner:  
Environment, Health, & Safety  J. Raymond, D. Wolf, S. Lopez, G. 
Gray, Ryan Bethel  Mary Betsch  
 
6.0 LATHES  
 
 
 
 
 
Photos L-R:  Completely  Guarded Lathe; Fully Enclosed Turret Lathe  
 
    
Photos L-R:  Sanding Fixture; Lead Screw Covers; Chuck Shields (must be interlocked); Spring Loaded Chuck Key  
6.1 The point of operation that exposes an employee to injury, must be guarded. The 
guarding device shall be designed to prevent the operator from having any part of 
his/her body in the danger zone during the operating cycle.   
6.2 There are three main areas of a lathe that require protection: (1) the chuck; (2) the lead 
screws, and (3) the point of operation.  The chuck holds the workpiece in place while 
machining and requires a shield.  The lead screws are responsible for moving t he cutting 
tool and must be protected to prevent entanglement injury to the operator.  The point of 
operation produces flying chips and is where the cutting tool makes contact with the 
work piece.  
6.3 Shields and/or enclosures are required for properly guarding lathes.   
6.3.1 The chuck shield guard must be interlocked.  
6.3.2 The chuck key must be self -ejecting.  
6.3.3 CNC lathe doors must be interlocked, all hard guards in place around the lathe, 
the chip hopper conveyor fully guarded and foot pedals guarded.  
6.4 If sanding using a lathe, a designated lathe tool belt sander is required. It is prohibited to 
sand using a lathe without this fixture in place.  


 Page 8 of 28 
    
    
Title: Machine Safety  Doc. No./ 
Version:  03-010 
Rev 1 2 Date: Sept  2025  
Function / Organization:  Author(s):  Functional Owner:  
Environment, Health, & Safety  J. Raymond, D. Wolf, S. Lopez, G. 
Gray, Ryan Bethel  Mary Betsch  
 
6.5 If there is a walkway behind the lathe, install a barrier guard to protect operators and 
bystanders from flying debris.  This barrier should extend from the floor to above the 
highest point of the lathe to provide maximum protection.  
6.6 All exposed mechanical power transmission apparatus (under 10’ or 3 meters from the 
floor or working platform) must be guarded.  
6.7 For all lathes where injury may result if motors were to restart after power failures, 
dropout/anti -restart protection must be in place to control voltage to all actuators (120V 
or less).  
6.8 Functional E -stops must be in place.  
 
7.0 PIPE BENDING, FORMING, THREADING MACHINES  
7.1 The machine control system (electrical, mechanical, hydraulic, or pneumatic) must 
include clearly identified stop and emergency stop controls.  
7.2 For all machines where injury may result if motors were to restart after power failures, 
dropout/anti -restart protection must be in place to control voltage to all actuators (120V 
or less).  
7.3 For machine initiation, implement one of the following (in order of priority):  
7.1.1 Where possible, machine initiation shall require that actuation be from a control 
station(s) located outside the associated hazard zone(s) and protected in such a 
way that no body part can access the hazard zone(s).   
7.1.2 For machines with control stations within the hazard zone (eg foot pedal), a risk 
assessment and one -over-one review specific to the actuation process must be 
completed to determine if the operator is outside the point of operation when 
activation occurs.   Solutions could include, mounting the foot pedal, material 
support mechanism, machine guarding such as pressure sensitive mats, hard 
guards, laser scanners, two -hand controls etc. to protect hands from entering the 
hazard zone.  
7.1.3 Documented operational controls must be in place and audited periodically 
where guarding is not feasible.  This option is only allowed for non -production 
machines used infrequently and the machine must be locked when not in use.  A 
risk assessment and one -over-one review specific to the actuation process must 
be completed to establish controls and layered auditing requirements.  
7.4 All exposed mechanical power transmission apparatus (under 10’ or 3 meters from the 
floor or working platform) must be guarded.  
7.5 All guards including presence sensing devices, safety mat devices and two -handed 
controls must meet the following criteria:  

 Page 9 of 28 
    
    
Title: Machine Safety  Doc. No./ 
Version:  03-010 
Rev 1 2 Date: Sept  2025  
Function / Organization:  Author(s):  Functional Owner:  
Environment, Health, & Safety  J. Raymond, D. Wolf, S. Lopez, G. 
Gray, Ryan Bethel  Mary Betsch  
 
7.5.1 Prevent inadvertent entry of body parts into the hazard zone.  
7.5.2 Create no pinch points  
7.5.3 Mounted  
7.5.4 Offer maximum visibility  
7.5.5 Tested periodically according to OEM specifications and included in the site PM 
program  
7.6 Foot controls must be protected to prevent unintentional operation.  
7.7  Cord -connected portable pipe threading machines must have a momentary contact 
device (eg dead man switch) to control the power input to the cord -connected portable 
pipe threading machine or power drive. A momentary contact foot switch is an example 
of such  device.  
7.8 CNC Automated Bending Equipment  
 
  
 
 
 
7.8.1 For CNC automated benders where hard guards do not eliminate all risk, 
presence -sensing devices must be installed to protect the point of operation and 
be operational during the bending cycle.  
7.8.2 Load and unload positions for operators must be located outside the work zone 
and away from hazardous mechanisms.  Hazardous machine movement must be 
inhibited or access prevented by means of fixed or interlocking guards or other 
engineering control devic e. 
7.8.3 Powered motion necessary for adjustment or maintenance, shall be initiated only 
by a step -by-step function where access is required with the guards in the open 
position and protectives devices suspended.  
 
8.0 DRILL PRESSES  


 Page 10 of 28 
    
    
Title: Machine Safety  Doc. No./ 
Version:  03-010 
Rev 1 2 Date: Sept  2025  
Function / Organization:  Author(s):  Functional Owner:  
Environment, Health, & Safety  J. Raymond, D. Wolf, S. Lopez, G. 
Gray, Ryan Bethel  Mary Betsch  
 
 
 
8.1 Operators must be protected from the rotating chuck and flying debris that is produced 
by the drill bit.  
8.2 The two areas on a drill press that must be protected are:  
8.1.1 Belt and pully  
8.1.2 Spindle and drill bit  
8.1.3 A cover should be installed over the belt and pully  
8.1.4 Telescoping shields must be attached to cover the spindle and drill bit and will 
retract as the drill bit comes down into the part.  An example of a telescoping 
shield is below:  
 
 
 
 
 
 
 
 
 
 


 Page 11 of 28 
    
    
Title: Machine Safety  Doc. No./ 
Version:  03-010 
Rev 1 2 Date: Sept  2025  
Function / Organization:  Author(s):  Functional Owner:  
Environment, Health, & Safety  J. Raymond, D. Wolf, S. Lopez, G. 
Gray, Ryan Bethel  Mary Betsch  
 
8.1.5 A chip shield can be used if a telescoping shield is not an appropriate solution for 
the type of drilling needed.  However, the chip shield must always be used when 
the spindle of the drill press is turning.  Additionally, employees must be trained 
never t o reach around the rotating spindle while in operation.  An example of a 
chip shield is below:  
   
 
9.0 HYDRAULIC PRESSES  
          
 
9.1 General machine guards such as barrier guards, two -hand control devices, and 
electronic safety devices must be provided to protect the operator and other employees 
in the machine area from hazards created by point of operation, nip points, pass through 
hazards etc. Employees must not be able to reach in, around, above or below the point 
of operation.  The back and sides of the machine must be guarded as well to protect 
machine operators and bystanders.  
9.2 Guards must not create hazards themselves and  must be attached to the machine and 
only utilize fasteners not readily removable.  
9.3 The guard shall offer visibility of the point of operation appropriate with the requirements 
of the work being performed, without allowing access to the point of operation.  
9.4  Interlocked barrier guards used for safeguarding the point of operation shall prevent the 
guard from opening until hazardous motion has stopped or be located at the proper  
safety distance so operators and bystanders are unable to reach the point of operation. 
The barrier guards also prevent the starting of the machine until properly closed.  


 Page 12 of 28 
    
    
Title: Machine Safety  Doc. No./ 
Version:  03-010 
Rev 1 2 Date: Sept  2025  
Function / Organization:  Author(s):  Functional Owner:  
Environment, Health, & Safety  J. Raymond, D. Wolf, S. Lopez, G. 
Gray, Ryan Bethel  Mary Betsch  
 
9.5 Opening and reclosing of an interlocked barrier guard shall not allow resumption of the 
press motion automatically.  
9.6 Types of Interlocks shall be electro -mechanical with positive opening contacts, and 
coded magnetic non -contact switches.  
9.7 Two Hand Control safeguarding devices shall incorporate an anti -tie down feature that 
requires both hands to concurrently operation within 500 milliseconds to initiate a press 
cycle. If the hands are removed, the cycle shall stop. Two hand controls shall be 
installed at the proper safety distance in accordance with applicable safe distance 
calculations.  
9.8 Presence sensing safeguarding devices when interrupted by any object shall stop all 
motion of the press cycle during any hazardous motion. Removal of any object from the 
sensing field shall NOT cause resumption of the machine cycle. Presence sensing 
devic es shall be installed at the proper safety distance in accordance with applicable 
safe distance calculations.  
9.9 Safety related control functions shall be incorporated to provide an immediate stop of the 
machine cycle in the event of a safeguarding component, device, module or system 
failure.  
9.10 Operating controls must be located away from the die area and should employ dual palm 
buttons.  
9.11  An emergency stop button shall be available with easy access to the operator and 
provide an immediate stop to the cycling of the press slide or stop existing auxiliary 
equipment posing a hazard. Stop functions used for hydraulic or pneumatic press cycling  
shall be a category B PLa  or category 1 PLb stop.  
9.12 A main power disconnect switch only lockable in the off position shall be provided for 
every power press control system.  
9.13 Power transmission components must be enclosed.  
9.14 Foot-actuated hydraulic pumps (e.g. enerpacs) are prohibited in Manufacturing, Repair 
Centers, R&D and Warehouse operations.  
9.15 Hydraulic pumps, originally designed to be portable, (e.g. Enerpacs) are prohibited in 
Manufacturing, Repair Centers, R&D and Warehouse operations unless no body part 
can reach the point of operation and an ejection curtain or shield is in place to prevent  
flying debris.  For Service sites and in Maintenance operations, portable hydraulic 
pumps are only allowed if used according to manufacturer specifications.  
 
10.0 BALANCING MACHINES  

 Page 13 of 28 
    
    
Title: Machine Safety  Doc. No./ 
Version:  03-010 
Rev 1 2 Date: Sept  2025  
Function / Organization:  Author(s):  Functional Owner:  
Environment, Health, & Safety  J. Raymond, D. Wolf, S. Lopez, G. 
Gray, Ryan Bethel  Mary Betsch  
 
  
 
10.1 The point of operation that exposes an employee to injury, must be guarded and 
interlocked. Employees must not be able to reach in, around, above or below the point of 
operation.  The back and sides of the machine must be guarded as well to protect 
machin e operators and bystanders.  
10.2 The guarding device shall be designed to prevent the operator from having any part of 
his/her body in the danger zone during the operating cycle.  Interlocked barrier guards 
used for safeguarding the point of operation shall prevent the guard from opening  until 
hazardous motion has stopped or be located at the proper safety distance so operators 
and bystanders are unable to reach the point of operation. The barrier guards must also 
prevent the starting of the machine until properly closed.  Opening and  reclosing of an 
interlocked barrier guard shall not allow resumption of the motion automatically.  
10.3 The enclosure must be designed to withstand the force of flying projectiles to protect 
employees.  
10.4 Devices designed for securely loading the part must be used at all times.  Operators 
must be aware of the center of gravity when loading parts.  
10.5 The belt must be tensioned where applicable according to manufacturer instructions and 
be free of excessive wear or damage.  
10.6 Machine operators must be trained on the documented work instructions for balancing 
work.  
10.7 An emergency stop button shall be available with easy access to the operator and 
provide an immediate stop to the cycling of the machine.  
 
11.0 GRINDING MACHINES AND PEDESTAL OR BENCH MOUNTED GRINDERS  


 Page 14 of 28 
    
    
Title: Machine Safety  Doc. No./ 
Version:  03-010 
Rev 1 2 Date: Sept  2025  
Function / Organization:  Author(s):  Functional Owner:  
Environment, Health, & Safety  J. Raymond, D. Wolf, S. Lopez, G. 
Gray, Ryan Bethel  Mary Betsch  
 
   
11.1 Grinding Machines  
11.1.1  The point of operation that exposes an employee to injury, must be guarded. The 
guarding device shall be designed to prevent the operator from having any part 
of his/her body in the danger zone during the operating cycle.  
11.1.2 An emergency stop button shall be available with easy access to the operator 
and provide an immediate stop to the cycling of the machine.  Pedestal and 
bench grinders are excluded.  
11.1.3 The enclosure must be designed to withstand the force of flying projectiles to 
protect employees.  
11.1.4 Foot controls must be protected to prevent unintentional operation.  
 
11.2 Pedestal or Bench Mounted Grinders  
11.2.1 All grinders must be mounted to floors or benches. The tool rest must be 
adjusted within 1/8 inch (3 mm) of the grinding wheel. Adjustable tongue guards 
should be within 1/4 inch (6 mm) from the grinding wheel.  Guards for brushing  
and buffing are not required.  Side guards must cover the spindle, nut and flange, 
and at least 75% of the wheel. Safety shields must be clear to allow the user to 
see the wheel. Side guards must cover the spindle, nut, flange, and 75% of the 
wheel. Each s tone or wire brush must have an adjustable, clear debris shield.  
11.2.2 A go/no -go gauge must be attached to the grinder and Operators must be trained 
in it’s use.  
11.2.3 Abrasive wheels shall be closely inspected and ring -tested before mounting to 
ensure that they are free from cracks or defects.  


 Page 15 of 28 
    
    
Title: Machine Safety  Doc. No./ 
Version:  03-010 
Rev 1 2 Date: Sept  2025  
Function / Organization:  Author(s):  Functional Owner:  
Environment, Health, & Safety  J. Raymond, D. Wolf, S. Lopez, G. 
Gray, Ryan Bethel  Mary Betsch  
 
11.2.4 Speeds should not exceed the manufacturer recommendations for the wheels 
and brushes used.  
11.2.5 A face shield plus safety glasses or foam -lined safety glasses/goggles must be 
worn when using a pedestal or bench grinder.  
 
12.0 BRAKE PRESSES  
   
12.1 Both sides, and back of the brake press must be guarded and interlocked or the use of a 
presence sensing device which must be operational.  
12.2 Light curtains are required to be used on the front of the brake press during operation 
and specifically programmed for each part number and associated bends.  Minimum 
object sensitivity should not be set to greater than ¼” (0.6 cm).  Creep speed is requi red 
at ¼”.  Controls must be in place to limit operators from modifying the light curtain 
program.  
12.3 When 2 operators must operate a brake press together, 2 foot  pedals or 2 sets of palm 
buttons must be incorporated at Performance Level PLc or PLd; or Category 2 or 3 and 
installed by a third party.  The controls must be actuated within ½ second of each other. 
If the risk assessment determines the risk is low, the BU EHS Leader and L1 leader 
must approve the deviation.  
12.4 Where foot pedals are used, foot pedals must be guarded.  
12.5 If robots are used, a completely enclosed and interlocked gate must be in place to meet 
robotic standards.  
12.6 The operator shall hold and support the workpiece by the use of both hands no closer 
than the minimum safe distance of 4 inches (10.6 cm).  The minimum safe distance of 4 
inches (10.6 cm) shall be measured from the exterior point of contact of the power p ress 
brake die closest to an employee.  If both hands are not used to hold the workpiece, 
additional safeguarding shall be provided to protect the free hand.  At a minimum, a risk 
assessment must be performed on small parts where hands do not meet the minimum 


 Page 16 of 28 
    
    
Title: Machine Safety  Doc. No./ 
Version:  03-010 
Rev 1 2 Date: Sept  2025  
Function / Organization:  Author(s):  Functional Owner:  
Environment, Health, & Safety  J. Raymond, D. Wolf, S. Lopez, G. 
Gray, Ryan Bethel  Mary Betsch  
 
safe distance.  Hand tools must be used when loading or unloading if the operator hands 
are closer than the safe distance.   
12.7 If other individuals are exposed to the point of operation hazard, safeguarding shall be 
provided for those individuals.  
12.8 The risk assessment must include proper hand placement for each part to eliminate the 
risk of hands caught between the die and the workpiece during the bending cycle.   
 
13.0 MILLING, DRILLING, AND BORING MACHINES  
   
13.1 The work must be properly secured on the work table, with a fixture, clamp, or vise.  
13.2 Cutting tools must be securely fastened in the machine spindle, using the proper 
accessory tool.  
13.3 The point of operation that exposes an employee to injury must be guarded. The 
guarding device shall be designed to prevent the operator from having any part of 
his/her body in the danger zone during the operating cycle.   
13.4 An emergency stop button shall be available with easy access to the operator and 
provide an immediate stop to the cycling of the machine.   
13.5 The drawbar must be covered if within 7 feet (2.1 meters) from the floor or platform.  
13.6 Shields must be affixed to the machine (interlocked preferred), and designed to 
withstand the force of flying projectiles. Additionally, employees must be trained never to 
reach around the rotating spindle while in operation.  
13.7 Foot controls must be protected to prevent unintentional operation.  
14.0 RUBBER AND PLASTIC MILL MACHINES  


 Page 17 of 28 
    
    
Title: Machine Safety  Doc. No./ 
Version:  03-010 
Rev 1 2 Date: Sept  2025  
Function / Organization:  Author(s):  Functional Owner:  
Environment, Health, & Safety  J. Raymond, D. Wolf, S. Lopez, G. 
Gray, Ryan Bethel  Mary Betsch  
 
 
14.1 Mill machines must be installed so that the top of the operating rolls is not less than 50 
inches (127 cm) above the operator working level.  
14.2 Mill machines must be installed so that employees cannot reach through, over, under, or 
around to come in contact with the in running nip point or be caught between a roll and 
an adjacent object.  
14.3 A safety trip control shall be provided in front and in back of each mill. It shall be 
accessible and shall operate readily on contact. The safety trip control shall be one of 
the following types or a combination thereof. All trip and emergency switches s hall not be 
of the automatically resetting type, but shall require manual resetting.  
• Pressure -sensitive body bars  shall be installed at the front and the back of each mill 
(applies to mills at or over 46 inches (117 cm) in top roll height).  Body bar installation 
must be near abdomen height for all Operators to ensure it will trip under pressure but 
still allow acces s to the safe working area.  These bars shall operate readily by 
pressure of the mill operator's body and not allow the hands to enter the in running nip 
point.  
• Safety triprod . Installed in the front and in the back of each mill and located within 2 
inches (5 cm) of a vertical plane tangent to the front and rear rolls. The top rods shall 
be not more than 72 inches (1.8 m) above the level on which the operator stands. The 
tripro ds shall be accessible and shall operate readily whether the rods are pushed or 
pulled.  
• Safety tripwire cable or wire center cord.  Installed in the front and in the back of 
each mill and located within 2 inches (5 cm) of a vertical plane tangent to the front and 
rear rolls. The cables shall not be more than 72 inches (1.8 m) above the level on 
which the operator stands. The tripwire cable or wire center cord shall operate readily 
whether cable or cord is pushed or pulled.  
14.4 All mills irrespective of the size of the rolls or their arrangement (individually or group -
driven) shall be stopped within a distance, as measured in inches of surface travel, not 
greater than 1½ percent of the peripheral no -load surface speeds of the re spective rolls 
as determined in feet per minute.  The site Manufacturing Engineer or equivalent is 
required to contact the OEM to verify the stopping distance conforms to this standard.  
15.0 BELT SANDERS  


 Page 18 of 28 
    
    
Title: Machine Safety  Doc. No./ 
Version:  03-010 
Rev 1 2 Date: Sept  2025  
Function / Organization:  Author(s):  Functional Owner:  
Environment, Health, & Safety  J. Raymond, D. Wolf, S. Lopez, G. 
Gray, Ryan Bethel  Mary Betsch  
 
  
15.1 Guarding shall be provided to protect against in -running nip points.  
15.2 Belt sanding machines shall be provided with guards at each nip point where the 
sanding belt runs onto a pulley. These guards shall effectively prevent the hands or 
fingers of the operator from coming in contact with the nip points. The unused run of the 
sanding belt shall be guarded against accidental contact.  
15.3 A motor cover must be in place.  
15.4 The gap between the table and the sanding belt must not exceed 1/8” (2 mm) at rest.   
15.5 Where a belt sander and disc sander are co -located on the same piece of equipment, 
only 1 operator may utilize the machine at one time.  
 
16.0 VERTICAL TURRET LATHE  
   
16.1 The point of operation that exposes an employee to injury must be guarded. The 
guarding device shall be designed to prevent the operator from having any part of 
his/her body in the danger zone during the operating cycle.   
16.2 During setup, the jog setting must be set to creep speed.  
16.3 Guards must be affixed, interlocked, and designed to withstand the force of flying 
projectiles.  
16.4 All exposed mechanical power transmission apparatus (under 10’ or 3 meters from the 
floor or working platform) must be guarded.  


 Page 19 of 28 
    
    
Title: Machine Safety  Doc. No./ 
Version:  03-010 
Rev 1 2 Date: Sept  2025  
Function / Organization:  Author(s):  Functional Owner:  
Environment, Health, & Safety  J. Raymond, D. Wolf, S. Lopez, G. 
Gray, Ryan Bethel  Mary Betsch  
 
16.5  The chuck key must be self -ejecting  unless approved by the BU EHS leader for other 
safety reasons . 
16.6 An emergency stop button shall be available with easy access to the operator and 
provide an immediate stop to the cycling of the machine.  
17.0 METAL SHEARS  
         
17.1 Both sides, and back of the shear must be guarded and interlocked or the use of a 
presence sensing device which must be operational.  
17.2 The front of the metal shear must have a finger guard or barrier guard adjusted to no 
greater than ¼” (0.6 cm) above the material.  Where this guard is not in place and 
operators are exposed to blades or hold downs, the blade and hold downs must  be set 
within ¼" (0.6 cm) of the tabletop OR light curtains must be used on the front of the 
shear during operation.  Controls must be in place to limit operators from modifying the 
light curtain.  
17.3 Where foot pedals are used, foot pedals must be guarded.  
17.4 If the hold downs on a shear create a hazard to the operator, they also require guarding.  
17.5 If robots are used, a completely enclosed and interlocked gate must be in place to meet 
robotic standards.  
17.6 If other individuals are exposed to the point of operation hazard, safeguarding shall be 
provided for those individuals.  
18.0 PLASMA and WATER JET CUTTING MACHINES  
 
18.1 Install an emergency stop to immediately shutdown the cutting and motion systems.  


 Page 20 of 28 
    
    
Title: Machine Safety  Doc. No./ 
Version:  03-010 
Rev 1 2 Date: Sept  2025  
Function / Organization:  Author(s):  Functional Owner:  
Environment, Health, & Safety  J. Raymond, D. Wolf, S. Lopez, G. 
Gray, Ryan Bethel  Mary Betsch  
 
18.2 For water jet and plasma machine, the point of operation that exposes an employee to 
Injury must be guarded. The guarding device shall be designed to prevent the operator 
from having any part of his/her body in the danger zone during the operating cycle and 
prevent contact with flying debris.   
18.3 Plasma machines require:  
18.1.1 Protection from UV radiation for Operator and bystanders.  
18.1.2 Adequate ventilation to protect against smoke and harmful gases generated 
during the cutting process.  
18.1.2 During the loading and unloading process, follow good material handling 
processes.  
  
19.0 LASER MACHINES  
 
19.1 Laser machines must be guarded according to the Laser Enclosure 
Requirements by Class below  
 
Class 1  
  Safe under all conditions of normal use.  
No additional safety measures required  if the enclosure ensures exposure remains below the Maximum 
Permissible Exposure (MPE)  
  
Class 2 / 2M  
  Visible low -power lasers (≤1 mW) . 
Generally safe due to the natural aversion response (blinking).  
Enclosures are recommended but not strictly required unless optical aids are used  
  
Class 3R  
  Low -power lasers (1 –5 mW) . 
May be hazardous under certain conditions.  
Enclosures are advised to prevent accidental exposure, especially when optical instruments are involved  
  
Class 3B  Medium -power lasers (5 –500 mW) . 


 Page 21 of 28 
    
    
Title: Machine Safety  Doc. No./ 
Version:  03-010 
Rev 1 2 Date: Sept  2025  
Function / Organization:  Author(s):  Functional Owner:  
Environment, Health, & Safety  J. Raymond, D. Wolf, S. Lopez, G. 
Gray, Ryan Bethel  Mary Betsch  
 
  Hazardous for direct eye exposure.  
Enclosures are required to contain the beam and prevent exposure.  
Must include interlocks on access panels and warning signs  
  
Class 4  
  High -power lasers (>500 mW) . 
Pose serious risks: eye and skin injury, fire hazards, and air contaminants.  
Mandatory enclosure with: Interlocks that shut off the laser when opened.  
Shielding to keep radiation below MPE. Warning signs and controlled access  
 
19.2 Install an emergency stop to immediately shutdown the laser (class 3B and 4) and 
motion systems.  
19.3 For laser cutting machine class 3 B and 4:  
19.3.1 Fixed barrier guards shall be installed to protect the operator and others in the 
area from point of operation hazards at the cutting tool and from ejected parts. 
These guards shall be adequate to protect against temperature and laser 
radiation.  
19.3.2 Torch Collision Detection is recommended.  
19.3.3 Adequate ventilation to protect against smoke and harmful gases generated 
during the cutting process.  
19.3.4 During the loading and unloading process, follow good material handling 
processes.   
19.4 Laser Safety Officer  
19.4.1 In accordance to local regulations and for the use of the Class 3B or 4, a laser 
safety officer shall be designated and trained by an external third party.  The 
Laser Safety Officer is required to implement all regulatory requirements at the 
site. 
19.4.2  In this case, a laser safety program shall be written and contain the following:  
• List of laser equipment with the level of radiation  
• The maintenance process with the qualified third party  
• Level of PPE expected  
• Inspection process  
• Training   
 
20.0 TRAINING  
20.1 Training must be provided for employees according to their roles and interactions with 
equipment.  

 Page 22 of 28 
    
    
Title: Machine Safety  Doc. No./ 
Version:  03-010 
Rev 1 2 Date: Sept  2025  
Function / Organization:  Author(s):  Functional Owner:  
Environment, Health, & Safety  J. Raymond, D. Wolf, S. Lopez, G. 
Gray, Ryan Bethel  Mary Betsch  
 
20.2 Machine Operators must be trained and understand all technical and safety -related 
requirements to operate the specific machinery without injury.  
20.3 Employees must be provided specific training on the machine they will operate as well 
as general safety precautions per the OEM and this Standard.  
20.4 Employees who provide maintenance and service on machinery must receive technical 
training on the machine they are servicing in order to complete their tasks safely.  
20.5 Maintenance and service personnel will also require Lockout Tagout training.  
20.6 Employees engaged in risk assessments and other subject matter expertise to support 
this Standard must be familiar with & understand the potential hazards associated with 
each unique machine guard hazard.  
 
21.0 DOCUMENT AND RECORD RETENTION   
21.1 All EHS records must be retained as per the Company’s and Operation’s document 
retention requirements, also as required by local or country laws.  
21.1.1  Training on risk assessments must be documented and records retained for a 
minimum of three (3) years or longer if required by local regulations.  Records 
are to include:  
21.1.2  Signed acknowledgement of the risk assessment;  
21.1.3  Trainers name;  
21.1.4  Date of training.  
 
22.0 PROGRAM REVIEWS  
22.1 Each Operation shall conduct an annual audit of this Standard, identify any gaps in 
performance, and implement corrective actions as necessary. All reviews must be 
documented.  
23.0 DEFINITIONS  
23.1 Annual – Once every 365 -days.  
23.2 Anti-Restart Device - Prevents the spontaneous restart of machinery or equipment when 
power is restored after a power interruption and will require the operator to turn the 
device off and then on again before the machine can run  
23.3 Barrier Guard - Designed to ensure that individuals cannot reach the hazard by reaching 
around, under, through or over (AUTO) the guard.  Material used in the construction of 
guards shall be of such design and strength as to protect individuals from ident ified 

 Page 23 of 28 
    
    
Title: Machine Safety  Doc. No./ 
Version:  03-010 
Rev 1 2 Date: Sept  2025  
Function / Organization:  Author(s):  Functional Owner:  
Environment, Health, & Safety  J. Raymond, D. Wolf, S. Lopez, G. 
Gray, Ryan Bethel  Mary Betsch  
 
hazards.  Guards shall be free of sharp edges, burrs, slag welds, fasteners, or other 
hazards that may injure individual when handling, removing, or using the guards or 
equipment.  Handles placed on guards shall be secured to the guard so as not to create 
a pinch point between the handles and the guard, frame, or machine. Guards shall be 
designed and constructed so as to ensure ease of use. Guards that are too large, heavy, 
or cumbersome to personnel may discourage proper use. The guard shall be designed 
and constructed to provide visibility of the hazard zone appropriate to the particular 
operation.  Guard shall be attached to the machine with fasteners that are not easily 
removed. Acrylic such as plexiglass shall not be used for shielding or safeguarding a s it 
is brittle and provides very little protection.  If visibility shall be provided, only 
polycarbonate thermoplastics which will resist cracking or breaking will be used, as 
these products have an impact strength 250 times greater than that of glass and  30 
times greater than that of acrylic (a similar thermoplastic). Any use of site windows 
requires that those windows are held firmly in place by mechanical means and not just 
with rubber gaskets.  This is to prevent the probability of any ejected part pas sing 
through these windows with minimum resistance.   Polycarbonate used in guarding that 
is exposed to cutting fluids or solvents shall be replaced at least every 5 years. The chart 
below shows the typical decay curves of the mechanical qualities of polyc arbonate over 
the years, as a consequence of exposure to aggressive liquids in comparison to 
situations in which the working area is clean or the panels are protected. Variations in 
decay speed are in relation to the exposure factor which can be total or p artial in cases 
in which the polycarbonate panels are protected on one side only or if the protection is 
damaged in some points or if it is not sealed.  
24.4 Bypass - To render ineffective any safety -related function of the control system.  
24.5 Control Reliability - Several Categories of control systems are detailed below, with the 
highest level of reliability being Category 4.  The level of injury risk shall determine the 
Category level to be used for control systems.  Hazard Levels 4 shall use Category 4 
control systems and Hazard Level 3 and 2 machines shall have at least Category 3 
control systems.  
Category B / PL a  
A safety system designed to meet operational requirements and withstand expected 
external influences. (This category is usually satisfied by selecting components 
compatible with the application conditions e.g., temperature, voltage, load).  
Note: A single fault or failure in the safety system can lead to the loss of the safety 
function.  
Category 1 / PL b  
The safety system shall meet the requirements of Category B but shall use “well -tried” 
safety principles and components. “Well -tried” principles and components include those 
which:  
▪ Avoids certain faults (e.g., short circuits)  

 Page 24 of 28 
    
    
Title: Machine Safety  Doc. No./ 
Version:  03-010 
Rev 1 2 Date: Sept  2025  
Function / Organization:  Author(s):  Functional Owner:  
Environment, Health, & Safety  J. Raymond, D. Wolf, S. Lopez, G. 
Gray, Ryan Bethel  Mary Betsch  
 
▪ Reduces probability of faults (e.g., over -rating selected components, over -
dimensioning for structural integrity)  
▪ Detect faults early (e.g., ground fault protection)  
▪ Assure the mode of the fault (e.g., ensure an open circuit when it is vital that 
power be interrupted should an unsafe condition arise)  
▪ Limit the consequences of the fault  
Note: A single fault or failure in the safety system can lead to the loss of the safety 
function. However, the use of “well tried” safety principles and safety components result 
in a higher level of safety system reliability.  
Category 2 / PL c  
The safety system shall meet the requirements of Category B. In addition, the machine 
shall be prevented from starting if a fault is detected upon application of machine power, 
or upon periodic checking during operation. (This suggests the use of a safety relay 
module with redundancy and self -checking. Single channel operation is permitted 
provided that the input devices such as machine guard interlocks, E -stop pushbuttons, 
are tested for proper operation on a regular basis.)  
Note: A single fault or failure in the safety system can lead to the loss of the safety 
function between the checking intervals. However, periodic checking may detect faults 
and permit timely maintenance of the safety system.  
Category 3 / PL d  
The safety system shall meet the requirements of Category B. In addition, the safety 
control system shall be designed such that a single fault will not lead to the loss of the 
safety function and, where practical, the single fault will be detected. (This r equires 
redundancy in the safety circuit monitoring module and the use of dual -channel 
monitoring of the input and output devices such as machine guard interlock switches, E -
stop pushbuttons, safety relays.)  
Mean Time To dangerous Failure (MTTFd) is between 3 years and 100 years for Cat 3 
device.  
Note: A single fault or failure in the safety system will not lead to the loss of the safety 
function and, where possible, will be detected.  
Category 4 / PL e  
The safety system shall meet the requirements of Category B. In addition, the safety 
control system shall be designed such that a single fault will not lead to the loss of the 
safety function and will be detected at or before the next demand on the safety system. If 
this is not possible, then the accumulation of multiple faults shall not lead to the loss of 
the safety function. (This also requires redundancy in the safety circuit and the use of 
dual-channel monitoring of the input and output devices such as  machine guard interlock 

 Page 25 of 28 
    
    
Title: Machine Safety  Doc. No./ 
Version:  03-010 
Rev 1 2 Date: Sept  2025  
Function / Organization:  Author(s):  Functional Owner:  
Environment, Health, & Safety  J. Raymond, D. Wolf, S. Lopez, G. 
Gray, Ryan Bethel  Mary Betsch  
 
switches, E -stop pushbuttons, safety relays. Here the number of allowable faults will be 
determined by the application, technology used, and system structure.).  
Mean Time To Dangerous Failure (MTTFd) is between 30 years and 100 years for Cat 4 
device.  
Note: A single fault or failure in the safety system will not lead to the loss of the safety 
function, and it will be detected in time to prevent the loss of the safety function.  
24.6 Emergency Stop - Is a self -latching device that that stops all machine operation upon 
actuation and shall remain in the actuated position until deliberately reset.   Also known 
as “E -stop”.  The emergency stop shall require manual reset, to be performed o nly after 
the correction of the event that caused the emergency stop actuation.  
E-stops shall be red, mushroom button with yellow background and not provided with 
ring guards or be otherwise obstructed from use.  
24.7 Feeding - The process of placing or removing material within or from the point of 
operation.   
24.8 Interlocked Guard - shall be designed so that the machine operation cannot be started 
with the guard open and will shut down the machine upon opening the guard on a 
running machine.  Employees shall not be able to gain access to the safeguarded space 
until hazards are eliminated. All the safety devices, an interlocking key, an E -button, and 
many others, shall be connected for monitoring by a safety relay or PLC.  
24.9 Interlocked Shield - A shield varies from a guard in that it is a movable barrier that is 
used to contain chips, flying sparks, debris, cutting fluid, etc. which uses a tamper -
resistant interlock switch to prevent machine start -up until the shield is in t he proper 
position.  This shield should be positioned between these hazards and the machine’s 
operator.  If other employees are exposed to these hazards, additional shields may be 
required.  
24.10 Light Curtains - These devices will stop machine motion when interrupted.  They shall be 
installed using the safety distance equation:  
The safety distance may be calculated using the following equation:  
Ds= K(T) Equation (1)  
Where: Ds = the safety distance  
K = the maximum speed that an individual can approach the hazard  
T = the total time to stop hazardous motion which includes various factors as 
described below  
The factor K is the speed constant and includes hand and body movements of an 
individual approaching a hazard zone. The following factors should be 
considered when determining K:  

 Page 26 of 28 
    
    
Title: Machine Safety  Doc. No./ 
Version:  03-010 
Rev 1 2 Date: Sept  2025  
Function / Organization:  Author(s):  Functional Owner:  
Environment, Health, & Safety  J. Raymond, D. Wolf, S. Lopez, G. 
Gray, Ryan Bethel  Mary Betsch  
 
Hand and arm movement;  
Twisting of the body or shoulder, or bending at the waist;  
Walking or running  
When the safety distance permits the operator to reach around the light curtain to 
the point of operation, additional light curtains with safety relay or PLC connected 
to the light curtain, shall be provided to prevent this access.  Light curtains are 
norm ally monitored by a control reliable circuit (Category 3 or 4).  
Care shall be taken in the consideration of light curtain devices.  Under no 
circumstances shall a site implement a light curtain that enables an operator to 
be behind the light curtain (between the light curtain and the hazard) while the 
machine is operat ing. 
24.11 Machinery - Any work equipment or tool, either portable or fixed, including 
machinery with moving parts.  
24.12 Machine Hazards - Hazards that arise from the point of operation. Examples 
include:  
• Rotating parts  
• Nip or pinch points  
• Reciprocating motions  
• Cutting  
• Forming  
• Shaping  
• Drilling  
• Bending  
• Polishing  
• Heating  
• Shafts and couplings  
• Belt and pulley mechanisms  
• Chain and sprocket assemblies  
• Meshing gears  
• Flywheels  
• Parts or debris that is ejected from the machine  
24.13 Mechanical Power Transmission Apparatus (MTPA) - Power transmission 
apparatus is all components of the mechanical system which transmit energy to 
the part of the machine performing the work. These components include 
flywheels, pulleys, belts, connecting ro ds, couplings, cams, spindles, chains, 
cranks, and gears.  

 Page 27 of 28 
    
    
Title: Machine Safety  Doc. No./ 
Version:  03-010 
Rev 1 2 Date: Sept  2025  
Function / Organization:  Author(s):  Functional Owner:  
Environment, Health, & Safety  J. Raymond, D. Wolf, S. Lopez, G. 
Gray, Ryan Bethel  Mary Betsch  
 
24.14 OEM – Original Equipment Manufacturer.  
24.15 Pass Through Protections - When any individual(s) can pass through the 
safeguard into the safeguarded area and is no longer detected by the safeguard 
or other supplemental safeguarding, additional measures shall be used in 
conjunction with the perimeter s afeguarding to prevent the individual from 
exposure to the hazard.  See Light curtain above.  
24.16 Point of Operation - Any area of the machine where work is performed on a 
material.  
24.17 Pressure -Sensitive Safety Mat - a non -programmable presence sensing device.  
Safety distance shall be used to apply this safeguarding method.  Normally 
monitored by a control reliable circuit (Category 3).  
24.18 Shield - is a movable barrier that is used to contain chips, flying sparks, debris, 
cutting fluid, etc. Should be positioned between these hazards and the machine’s 
operator.  If other employees are exposed to these hazards, additional shields 
may be requ ired.  It does not, however, necessarily prevent reaching around, 
under, through or over (AUTO).  
 
 
REVISION HISTORY  
Rev Date  Description  Approved By  
Orig Dec 2020  Initial Release  M. Betsch  
Rev 1  Feb 2023  Added specific requirements for wood and metal saws  M. Betsch  
Rev 2  April 2023  Added specific requirements for lathes  M. Betsch  
Rev 3  June 2023  
Added The Business Unit EHS Leader/VP Sustainability, Site EHS 
Leader and Site  Leader (eg plant manager) together may exclude  
equipment from these requirements. Documentation of review and 
the decision must be maintained at the site or in Gensuite ATS.  
Added several new definitions.  
Added specific requirements for pipe bending, forming, threading 
machines.  
 M. Betsch  
Rev 4  Sept 2023  Adding machine -specific requirements for drill presses  M. Betsch  
Rev 5  March 
2024  Added additional all -machine general guarding requirements; Adding 
machine -specific requirements for drill presses  M. Betsch  

 Page 28 of 28 
    
    
Title: Machine Safety  Doc. No./ 
Version:  03-010 
Rev 1 2 Date: Sept  2025  
Function / Organization:  Author(s):  Functional Owner:  
Environment, Health, & Safety  J. Raymond, D. Wolf, S. Lopez, G. 
Gray, Ryan Bethel  Mary Betsch  
 
Rev 6  June 2024  Added requirements for balance machines  M. Betsch  
Rev 7  Sept 2024  Added requirements for grinding machines  M. Betsch  
Rev 8  Dec 2024  Added requirements for brake presses  M. Betsch  
Rev 9  March 
2025  Added requirements for milling, drilling and boring machines  M. Betsch  
Rev 12  Sept 2025  Added 5 new machines :  Belt  Sanders, Vertical Turret Lathe, Metal 
Shears, Plasma and Water Jet Cutting Machine, and Laser Machine  M. Betsch

Document 3.Environment_Health_Safety_Policy:
TITLE: Quality Objectives
Environment, Health and Safety Policy
Ingersoll Rand is committed to operating sustainably in a way that safeguards our employees and minimizes our environmental impact. Our ongoing commitment to safety and sustainability is embedded in our business practices and reflected in our belief that our long-term success will be measured by financial performance and by a continued focus on improving the life of our customers, employees, suppliers, shareholders and the communities. You can Lean On Us to make Life Better!
We are driven by an entrepreneurial spirit and an ownership mindset, inspiring us to care deeply about our neighbors and shared planet. Ingersoll Rand is committed to reporting regularly on Environmental, Social and Governance (ESG) matters through the Annual Sustainability Report and consulting stakeholders on ESG issues. To achieve a culture in which all employees and other interested parties are responsible for the environment, safety and well-being of each other, Ingersoll Rand is committed to integrating sound environmental, health and safety (EHS) practices in the following ways.
Our Employees
- Ensure safe work conditions and behaviors by acting responsibly and proactively.
- Consult with employees and worker’s representatives on measures to implement to prevent accidents and injuries. In the event of an EHS incident, we take appropriate corrective actions to prevent recurrence at the specific location, as well as across the company.
- Provide EHS compliance training, including accident prevention and emergency planning and response, among others, to help protect our employees and communities.
- Minimize our environmental footprint in our own operations by implementing sound programs targeted at waste reduction and energy and water conservation; reducing the use of nonrenewable natural resources; and increasing the reuse and recycling of materials.
Our Stakeholders
Our Customers
- Collaborate with our customers to develop and provide products and services that help meet or exceed their EHS objectives, including a commitment to phase out hazardous substances.
- Engineer improvements into the environmental performance of our products with a focus on energy and water efficiencies, and life cycle impact.
- Minimize the negative sustainability impacts of raw materials.
- Increase the use of recycled raw materials.
- Commitment to product safety through compliance with applicable regulations, extensive product testing and quality assurance.
Our Supply Chain and Business Partners
- Ensure our vendors, partners, contractors, service providers, distributors and logistics partners uphold their commitment to improve their EHS programs and performance, and meet our EHS expectations.
- Collaborate with external stakeholders on best practices for sustainable raw materials.
Our Shareholders
- Drive transparency in our EHS performance by establishing targets and publicly communicating our performance against those targets.
Our Businesses
- Incorporate EHS and sustainability considerations into our decision-making processes, including our decisions relating to capital allocation.
- Implement, align and validate our EHS management systems with international standards. Share EHS best practices and valuable lessons learned across the company.
- Integrate all newly acquired companies and facilities into our EHS program.
Our Communities
- Communicate and address EHS concerns within the communities where our facilities are located.
- Communicate our EHS policy to all of our employees, and ensure it is available to other stakeholders and the public.
- Engage with our communities in meaningful ways to help promote our EHS objectives.
Regulatory Authorities
- Comply with, or exceed requirements of, global, national, state, and local statutes, regulations, and standards that protect the environment and human health and safety. This includes conducting due diligence for mergers and acquisitions.
- Conduct regular audits to verify compliance with current EHS regulatory requirements and company standards.
Roles and Responsibilities: Our Company EHS program, led by the Sr. Vice President, General Counsel and Secretary, is responsible for establishing this policy, governing compliance and regularly reviewing the company’s EHS performance with business unit leadership. Executive and senior level managers are responsible and held accountable for implementing this policy, allocating adequate resources for program implementation and communication. Site level managers and supervisors are responsible for executing EHS performance in their areas of responsibility and are expected to demonstrate behavior that is consistent with a culture of world-class EHS performance. It is the obligation of every employee working for or on the behalf of the Company to know and follow this policy at all times. All employees have an obligation to engage and communicate around any EHS matters or observations. Each employee has the authority and responsibility to take immediate action to prevent injury from unsafe actions and conditions.
Goals and Targets: We set aspirational targets, and measure, manage and communicate our performance accordingly. We strive to achieve our health and safety objective of Zero Injury and Incident across the organization. To ensure improvement in our EHS performance, we ensure our EHS Management System conforms to ISO standards and guidelines. We periodically engage diverse stakeholder groups globally for input and feedback on our EHS performance.
Through this commitment to ensure the safety, health and environmental sustainability, and overall well-being of our employees and business partners, Ingersoll Rand reaffirms its corporate sustainability commitments toward business excellence and being a truly responsible global corporate citizen.
We review and update this policy regularly or upon significant change external or internal circumstances.`;
