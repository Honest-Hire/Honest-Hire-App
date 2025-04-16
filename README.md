# Honest Hire Interview Integrity Scanner


![image](https://github.com/user-attachments/assets/804b3df6-d296-4522-af60-ba03788c8f95)

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



<img width="1436" alt="image" src="https://github.com/user-attachments/assets/9ab6ea6f-9a7b-425e-831e-80a6bd485e67" />



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

## Troubleshooting


There have been some issues with windows installation, where a depency called "fastlist-0.3.0-x64.exe" has been introduced by electron during the build process. The current fix is to either running the code locally as a dev server or building the executable file locally by running npm run build-win


If you encounter build errors:
1. Make sure all prerequisites are installed
2. Try clearing npm cache: `npm cache clean --force`
3. Delete node_modules and package-lock.json, then run `npm install` again
4. For macOS users: If you get permission errors, run `sudo chown -R $USER ~/.npm`

## Features

- **Display Configuration Check**: Detects if multiple displays are connected, which could potentially be used to view unauthorized information during an interview.
  


## Note on Detection Limitations

Please note that this application is at it's v1 stage and follows a low hanging fruit approach to detect a very popular cheating tool. 
As mentioned in the issue of https://github.com/Honest-Hire/Honest-Hire-App/issues/10 It may not detect all forms of cheating. Kindly checkout this mentioned issue for more details

## License

MIT 

## Privacy Notice

This application only collects information locally and does not transmit any data outside of your device. The scans performed are for the purpose of verifying interview integrity and are not stored beyond the application session. 

## Disclaimer
Mention of "Interview Coder" in either social media handles of contributors or any other github discussion/issues/similar pages refers to the project of "Interview Coder" by Honest Hire (available: here https://github.com/Honest-Hire/InterviewCoder) It should not be confused by any other online tool
