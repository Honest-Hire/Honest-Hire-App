# Interview Integrity Scanner

![image](https://github.com/user-attachments/assets/bfec654c-9f75-489c-ae0e-e0feee2f7130)

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
![image](https://github.com/user-attachments/assets/e0ac8ffa-f8c5-44a8-802f-9894e05fdf96)

## Troubleshooting

If you encounter build errors:
1. Make sure all prerequisites are installed
2. Try clearing npm cache: `npm cache clean --force`
3. Delete node_modules and package-lock.json, then run `npm install` again
4. For macOS users: If you get permission errors, run `sudo chown -R $USER ~/.npm`

## Features

- **Display Configuration Check**: Detects if multiple displays are connected, which could potentially be used to view unauthorized information during an interview.
- **Screen Sharing Check**: Verifies if the screen is being shared to multiple applications simultaneously, which might be used to receive external help.
- **Keyboard Device Check**: Detects if multiple keyboard devices are connected, which could potentially be used by someone else to provide answers.

## Technical Details

This application is built using Electron and uses system information APIs to detect potential cheating methods. The detection mechanisms include:

1. **Multiple Display Detection**: Uses the system's display configuration to detect if more than one display is connected.
2. **Screen Sharing Detection**: Analyzes running processes to identify common screen sharing applications.
3. **Keyboard Device Detection**: Scans USB devices to identify connected keyboard devices.

## Note on Detection Limitations

Please note that this application provides a best-effort approach to detecting cheating methods. It may not detect all forms of cheating, especially if sophisticated methods are employed. It is recommended to use this as one part of a comprehensive integrity strategy for online interviews.

## License

MIT 

## Privacy Notice

This application only collects information locally and does not transmit any data outside of your device. The scans performed are for the purpose of verifying interview integrity and are not stored beyond the application session. 

## Disclaimer
Mention of "Interview Coder" in either social media handles of contributors or any other github discussion/issues/similar pages refers to the project of "Interview Coder" by Honest Hire (available: here https://github.com/Honest-Hire/InterviewCoder) It should not be confused by any other online tool
