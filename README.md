# abflow
ABFlow is a web‑based priority management tool that helps you organize, schedule and track your tasks using the ABCDE method. Inspired by Trello, it was built with React on the frontend, Firebase for authentication and MongoDB for data storage.

The application has been deployed live using [Netlify](https://www.netlify.com/) for the frontend and [Render](https://render.com/) for the backend.<br>
Currently live deployed at: https://abflow.netlify.app
## Dependencies

To install all dependencies, run the following command on the `frontend`, `backend` and `root` folders:

```
npm install
```

### API Keys
You'll need to add your own API keys so the application can run on your side.<br>

- Firebase (frontend/.env):
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

- MongoDB (backend/.env):
```
MONGO_URI=
```

- Cloudinary (backend/.env):
```
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### Run the Application
Once all dependencies are installed and all API keys are placed in their respective places, run the following command on both `frontend` and `backend` folders:
```
npm run dev
```

**Note:** 
You will need [Node.js](https://nodejs.org/en/download) installed to be able to run the server.

## Preview


## Tests

To run all tests, execute:

```
npm test
```

**Note:** 
Make sure you're in the right directory to run the tests (`/frontend` or `/backend`)