To login for trial : 
username : kartikeygupta261204@gmail.com
password : 123@#

🌍 Travel Story

Travel Story is a full-stack web application that lets users create and manage their travel stories, connect with other travellers, and collaborate in groups.
It is built using React and Vite on the frontend, and Node.js, Express, and MongoDB on the backend.
The project is deployed using Vercel (frontend) and Render (backend), and images are stored using ImageKit.

🚀 Live App:

Frontend: https://travelstory-nine.vercel.app
Backend: Hosted on Render
Images: Stored and served via ImageKit


✨ Features :

•	User signup & login (JWT-based authentication)
•	Create, edit and delete travel stories
•	Upload images for stories
•	Mark stories as favourite
•	Search and filter stories
•	Find people with similar travel interests
•	Send and accept friend requests
•	Notifications system
•	Create and manage travel groups
•	Group announcements and invitations


🛠 Tech Stack :

	Frontend
    	React (Vite)
    	Tailwind CSS
    	Axios
    	React Router

	Backend
    	Node.js
    	Express.js
    	MongoDB & Mongoose
    	JWT Authentication
    	Multer
    	ImageKit
    	Deployment
    	Vercel (Frontend)
    	Render (Backend)
    	MongoDB Atlas
    	ImageKit CDN

📂 Project Structure

backend/
frontend/

⚙️ Environment Variables :

Backend (Render)
    $ MONGO_URI
    $ ACCESS_TOKEN_SECRET
    $ IMAGEKIT_PUBLIC_KEY
    $ IMAGEKIT_PRIVATE_KEY
    $ IMAGEKIT_URL_ENDPOINT
    $ BASE_URL

Frontend (Vercel)
    $ VITE_API_BASE_URL

▶ Run Locally
Backend
cd backend
npm install
node index.js

Frontend
cd frontend
npm install
npm run dev
