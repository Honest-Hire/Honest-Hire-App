# Honest Hire Interview Integrity Scanner

![image](https://github.com/user-attachments/assets/04905f38-7e26-4135-ab25-8ecb96b1c108)

A tool to detect potential cheating methods during online interviews.

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Git
- For macOS:
  - Xcode Command Line Tools: `xcode-select --install`
  - Additional build tools: `brew install pkg-config cairo pango libpng jpeg giflib librsvg pixman`
- For Windows:
  - Visual Studio Build Tools with C++ support
  - Python (2.7 or 3.x)

## Setup & Run

1. Clone the repository:
```bash
git clone <repository-url>
cd detect-interview-cheaters
```

2. Install dependencies:
```bash
npm install
```

3. Install Electron globally (first time only):
```bash
npm install -g electron
```

4. Start the application:
```bash
npm start
```

## Development

To run in development mode:
```bash
npm run dev
```

## Building

To create a distributable:
```bash
npm run build
```
![image](https://github.com/user-attachments/assets/79edfdb8-61ab-415c-a4d5-6df88407c458)


## Release Notes from v1.0.0
This is the first release version of Honest Hire
A simple app to detect if candidate could be cheating during live interview.

Only two detection strategies are supported

1. Detecting if the candidate is using the "Interview Coder", a AI app popularly used for cheating
2. Detecting if the candidate is using multiple monitors (it has been observed, a second monitor which mirrored display has been the number one method of cheating even by experienced candidates"

## Troubleshooting


There have been some issues with windows installation, where a depency called "fastlist-0.3.0-x64.exe" has been introduced by electron during the build process. The current fix is to either running the code locally as a dev server or building the executable file locally by running npm run build-win


If you encounter build errors:
1. Make sure all prerequisites are installed
2. Try clearing npm cache: `npm cache clean --force`
3. Delete node_modules and package-lock.json, then run `npm install` again
4. For macOS users: If you get permission errors, run `sudo chown -R $USER ~/.npm`

## Features

- **Display Configuration Check**: Detects if multiple displays are connected, which could potentially be used to view unauthorized information during an interview.
  
## Technical Details

This application is built using Electron and uses system information APIs to detect potential cheating methods. The detection mechanisms include:
 **Keyboard Device Detection**: Scans USB devices to identify connected keyboard devices.

## Note on Detection Limitations

Please note that this application provides a best-effort approach to detecting cheating methods. It may not detect all forms of cheating, especially if sophisticated methods are employed. It is recommended to use this as one part of a comprehensive integrity strategy for online interviews.

## License

MIT 

## Privacy Notice

This application only collects information locally and does not transmit any data outside of your device. The scans performed are for the purpose of verifying interview integrity and are not stored beyond the application session. 

## Disclaimer
Mention of "Interview Coder" in either social media handles of contributors or any other github discussion/issues/similar pages refers to the project of "Interview Coder" by Honest Hire (available: here https://github.com/Honest-Hire/InterviewCoder) It should not be confused by any other online tool
