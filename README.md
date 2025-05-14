# Live Poll Battle

A real-time polling application that allows users to create or join poll rooms and vote live. The results update instantly across all users in the same room.

## Features

- Create a new poll room with a custom question and options
- Join an existing poll room using a room code
- Vote on one of two options in a poll
- View real-time vote updates as other users vote
- Countdown timer where voting ends after 60 seconds
- Persistence of user votes across page refreshes
- Support for multiple rooms with different users

## Technology Stack

- **Frontend**: React.js
- **Backend**: Node.js with Express
- **Real-time Communication**: Socket.IO
- **Routing**: React Router

## Project Structure

```
├── client/                 # Frontend React application
│   ├── public/             # Public assets
│   └── src/                # Source files
│       ├── components/     # React components
│       │   ├── Home.js     # Home page component
│       │   └── PollRoom.js # Poll room component
│       ├── styles/         # CSS stylesheets
│       │   ├── App.css     # Main application styles
│       │   ├── Home.css    # Home page styles
│       │   └── PollRoom.css # Poll room styles
│       ├── App.js          # Main application component
│       └── index.js        # Entry point
└── server/                 # Backend Node.js server
    ├── index.js            # Server entry point
    └── package.json        # Backend dependencies
```

## Setup Instructions

### Prerequisites

- Node.js (v14.0.0 or higher)
- npm (v6.0.0 or higher)

### Server Setup

1. Navigate to the server directory:
   ```
   cd server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the server:
   ```
   npm start
   ```

   or for development with auto-reload:
   ```
   npm run dev
   ```

   The server will run on http://localhost:5000.

### Client Setup

1. Navigate to the client directory:
   ```
   cd client
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

   The client will run on http://localhost:3000.

## How to Use

### Creating a Poll Room

1. Open the application in your browser.
2. Enter your name in the "Your Name" field.
3. Click on the "Create a Poll" tab.
4. (Optional) Enter a custom question and two options.
5. Click "Create Poll Room".
6. Share the generated room code with others who want to join.

### Joining a Poll Room

1. Open the application in your browser.
2. Enter your name in the "Your Name" field.
3. Enter the room code provided by the poll creator.
4. Click "Join Poll Room".

### Voting in a Poll

1. Once in a poll room, click on one of the two options to cast your vote.
2. Watch as the results update in real-time as other users vote.
3. After 60 seconds, the poll will close and display the final results.

## Architecture Explanation

### Real-time Communication

The application uses Socket.IO to establish websocket connections between the client and server. This enables:

- Instant broadcasting of votes to all connected users
- Real-time updates of poll statistics
- Room-based message broadcasting

### Poll State Management

- Polls are stored in memory on the server using a Map data structure
- Each poll has a unique room ID generated using nanoid
- User votes are tracked to prevent multiple voting
- Poll rooms have a 60-second timer, after which voting is disabled
- Inactive polls are cleaned up periodically to free memory

### Room Management

- Rooms are managed using Socket.IO's built-in room functionality
- Users join specific rooms based on the room ID
- Messages and updates are broadcast only to users in the relevant room
- Authentication is simple (username only) for demonstration purposes

### State Persistence

- User information and votes are stored in localStorage on the client
- This allows the application to maintain state across page refreshes
- The server validates user identities when they reconnect

## Future Improvements

- User authentication system
- Support for creating polls with more than two options
- Ability to view past polls and results
- Admin controls for poll creators
- Custom themes and styling options
- Export poll results to CSV or PDF
