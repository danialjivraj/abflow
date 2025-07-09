# abflow
ABFlow is a web‑based priority management tool that helps you organize, schedule and track your tasks using the ABCDE method. Inspired by Trello, it was built with React on the frontend, Firebase for authentication and MongoDB for data storage.

The application has been deployed live using [Netlify](https://www.netlify.com/) for the frontend and [Render](https://render.com/) for the backend.<br>
Currently live deployed at: https://abflow.netlify.app

## Preview
<details open>
<summary>Image Previews</summary>

![image](https://github.com/user-attachments/assets/6763edb5-6c2d-487e-ae83-cbcfec9ebd37)
![image](https://github.com/user-attachments/assets/0c4985f9-fa93-40e0-84de-940ea2902a35)
![image](https://github.com/user-attachments/assets/6e1b676d-06bc-440f-8d3e-e8229c570546)
![image](https://github.com/user-attachments/assets/8017c6ad-5322-4d7c-8a5f-b509f15b9a8e)
![image](https://github.com/user-attachments/assets/b501511b-7201-470e-8623-b706e34561b2)
![image](https://github.com/user-attachments/assets/4e557451-3540-4f73-87e2-3fd07cee77d1)
![image](https://github.com/user-attachments/assets/c3bb6ce3-612b-486d-9507-6f821ecad1e7)
![image](https://github.com/user-attachments/assets/ae5da1b6-8505-4232-a2d8-3462f7391cc7)
![image](https://github.com/user-attachments/assets/9406aaba-950e-4984-a149-7ec0ed360252)
![image](https://github.com/user-attachments/assets/10793d63-9058-41f9-ab55-be45a918bf80)
![image](https://github.com/user-attachments/assets/aab81b8d-04e2-4982-90aa-0fd9e5e8dffd)
![image](https://github.com/user-attachments/assets/6c5505f2-279f-44a0-89f4-b32d5acde808)
</details>

## Dependencies
First, clone the project:

```
git clone https://github.com/danialjivraj/abflow
```
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


## Tests

To run all 700+ tests, execute:

```
npm test
```

**Note:** 
Make sure you're in the right directory to run the tests (`/frontend` or `/backend`)
