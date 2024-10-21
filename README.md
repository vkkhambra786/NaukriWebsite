# NaukriWebsite
# Job Portal (Naukri Clone)

This project is a Naukri-like job portal, built using **ReactJS**, **NodeJS**, and **MongoDB Atlas**. It allows employers to create, update, and delete job listings, while job seekers can search for jobs, apply with their resumes and cover letters, and filter jobs by various criteria.

## Features

### For Employers:
- **Create, update, and delete job listings**
  - Job listings include details such as job title, company name, location, salary, and description.
  - Input validation is implemented on both the front-end and back-end to ensure accurate data submission.
- **View applications for job listings**
  - Employers can view the resumes and cover letters submitted by job seekers for each job listing.

### For Job Seekers:
- **Search jobs by keyword**
  - Job seekers can search for jobs using a keyword search functionality.
- **Filter jobs by location, job type, and salary range**
  - Jobs can be filtered by their location, job type (full-time, part-time, remote), and salary range.
- **Apply for jobs**
  - Job seekers can submit their resume and cover letter directly on the job listing page.

## Technology Stack

### Frontend:
- **ReactJS**: Used to build the user interface for both employers and job seekers.
- **CSS**: For styling the frontend components.

### Backend:
- **NodeJS**: Backend server for handling API requests.
- **ExpressJS**: For routing and handling REST API requests.
- **MongoDB Atlas**: Cloud-based NoSQL database for storing job listings, user details, and applications.

## Installation

### Prerequisites:
- **Node.js** (v14 or higher)
- **MongoDB Atlas Account** (or any MongoDB instance)

### Steps:

1. Clone the repository:
    ```bash
    git clone https://github.com/your-username/job-portal.git
    cd job-portal
    ```

2. Install dependencies for both frontend and backend:
    ```bash
    cd frontend
    npm install
    cd ../backend
    npm install
    ```

3. Set up environment variables:

   In the `backend` folder, create a `.env` file with the following variables:
    ```env
    MONGODB_URI=your-mongodb-uri
    JWT_SECRET=your-secret-key
    ```

4. Start the development server:

    - Backend:
      ```bash
      cd backend
      npm run dev
      ```
    
    - Frontend:
      ```bash
      cd frontend
      npm start
      ```

5. Open the application:
    - Frontend will run on: `http://localhost:3000`
    - Backend will run on: `http://localhost:3001`

## Folder Structure

