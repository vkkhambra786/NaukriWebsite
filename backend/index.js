require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcryptjs")
 
// Initialize Express app
const app = express();
app.use(bodyParser.json());
app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// vke3Cgm3QTE0lV0G
//mongodb+srv://vkkhambra786:<db_password>@cluster0.lphsb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
//let uri = "mongodb+srv://vkkhambra786:olsBTIlUOQVT4KLj@cluster0.buill3t.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
let uri = "mongodb+srv://vkkhambra786:vke3Cgm3QTE0lV0G@cluster0.lphsb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
// Function to connect to MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect(uri); // Removed deprecated options
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
}

// Call the function to connect to the database
connectToDatabase();

 
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["job_seeker", "employer"], required: true }, // Job Seeker or Employer
});
const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  companyName: { type: String, required: true },
  location: { type: String, required: true },
  salary: { type: Number, required: true },
  experience: { type: String, required: true },
  skills: { type: [String], required: true },
  jobType: { type: String, enum: ["full-time", "part-time", "remote"], required: true }, // Job type field
  employer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  applications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Application' }] 
});

 
const Job = mongoose.model("Job", jobSchema);
const applicationSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  jobSeekerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resume: String,
  coverLetter: String,
  appliedAt: { type: Date, default: Date.now }
});

const Application = mongoose.model('Application', applicationSchema);
// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
const jwt = require("jsonwebtoken");
const secretKey = "your_jwt_secret_key"; // Use environment variable for production

// Generate JWT
const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, secretKey, { expiresIn: "1h" });
};

// Middleware to verify JWT
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(' ')[1];  // Extract token from 'Bearer <token>'
console.log("Token", token);
console.log('JWT_SECRET:', process.env.JWT_SECRET);

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('Token verification error:', err); // Debug error
      return res.status(403).json({ error: "Invalid token" });
    }

    req.user = decoded; // Store the decoded token data in req.user
    next();
  });
};


app.post("/api/register", async (req, res) => {
  const { username, email, password, role } = req.body;
  if (!username || !email || !password || !role) {
    return res.status(400).json({ error: "Please provide all fields" });
  }

  try {
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Create new user
    const newUser = new User({ username, email, password, role });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" ,
      newUser});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Please provide email and password" });
  }

  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Check if the password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = generateToken(user);

    // Send the token back to the user
    res.json({ message: "Logged in successfully", token ,  role: user.role
       });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});
// Create Job (Employer only)
 
app.post("/api/jobs", authenticate, async (req, res) => {
  if (req.user.role !== "employer") {
    return res.status(403).json({ error: "Access denied" });
  }

  const { title, description, companyName, location, salary, experience, skills, jobType } = req.body;

  // Input validation
  if (!title || !description || !companyName || !location || !salary || !experience || !skills || !jobType) {
    return res.status(400).json({ error: "Please provide all fields" });
  }

  try {
    const job = new Job({
      title,
      description,
      companyName,
      location,
      salary,
      experience,
      skills,
      jobType, // new field for job type
      employer: req.user.id
    });
    await job.save();
    res.status(201).json({ message: "Job created successfully", job });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});


// Update Job (Employer only)
app.put("/api/jobs/:id", authenticate, async (req, res) => {
  if (req.user.role !== "employer") {
      return res.status(403).json({ error: "Access denied" });
  }

  const { title, description, companyName, location, salary, experience, skills, jobType } = req.body;

  // Input validation
  if (!title || !description || !companyName || !location || !salary || !experience || !skills || !jobType) {
      return res.status(400).json({ error: "Please provide all fields" });
  }

  try {
      const job = await Job.findById(req.params.id);

      if (!job) {
          return res.status(404).json({ error: "Job not found" });
      }

      // Check if the employer is the owner of the job
      if (job.employer.toString() !== req.user.id) {
          return res.status(403).json({ error: "Access denied" });
      }

      job.title = title;
      job.description = description;
      job.companyName = companyName;
      job.location = location;
      job.salary = salary;
      job.experience = experience;
      job.skills = skills;
      job.jobType = jobType;

      await job.save();
      res.status(200).json({ message: "Job updated successfully", job });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
  }
});


// Delete Job (Employer only)
app.delete("/api/jobs/:id", authenticate, async (req, res) => {
  if (req.user.role !== "employer") {
      return res.status(403).json({ error: "Access denied" });
  }

  try {
      const job = await Job.findById(req.params.id);

      if (!job) {
          return res.status(404).json({ error: "Job not found" });
      }

      // Check if the employer is the owner of the job
      if (job.employer.toString() !== req.user.id) {
          return res.status(403).json({ error: "Access denied" });
      }

      // Use findByIdAndDelete to remove the job
      await Job.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: "Job deleted successfully" });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
  }
});



// Get all jobs (Job Seekers can browse)
 
app.get("/api/jobs", async (req, res) => {
  try {
    const jobs = await Job.find().populate("employer", "username");
    res.json({ jobs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Apply to a Job (Job Seekers only)
 
const multer = require('multer');
 
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads'); // Ensure this folder exists
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`); // Unique filename
  }
});

// Multer file filter for PDFs only
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true); // Accept the file
  } else {
    cb(new Error('Only PDF files are allowed!'), false); // Reject the file
  }
};

// Configure Multer to handle both file and text fields
const upload = multer({
  storage: storage,
  fileFilter: fileFilter
}).fields([
  { name: 'resume', maxCount: 1 }, // Expect 'resume' as a file
  { name: 'coverLetter', maxCount: 1 } // Expect 'coverLetter' as a text field
]);
// POST endpoint for job application
app.post('/api/jobs/:id/apply', authenticate, (req, res) => {
  // Ensure the user is a job seeker
  console.log('Request body:', req.body);
  console.log('Request files:', req.files);
  if (req.user.role !== 'job_seeker') {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Handle file upload and form-data
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(500).json({ error: err.message });
    }
    console.log('Post-upload Request body:', req.body);
    console.log('Post-upload Request files:', req.files);
    // Extract the text and file data
    const coverLetter = req.body.coverLetter; // Get cover letter
    const resumeFile = req.files.resume[0];

    // Ensure both resume and cover letter are provided
    if (!resumeFile) {
      return res.status(400).json({ error: 'Resume file is required' });
    }
    if (!coverLetter) {
      return res.status(400).json({ error: 'Cover letter is required' });
    }

    try {
      // Find the job by ID
      const job = await Job.findById(req.params.id);
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      // Create a new application
      const newApplication = new Application({
        jobId: job._id,
        jobSeekerId: req.user.id, // Assume req.user.id contains the authenticated user's ID
        resume: resumeFile.path, // Store resume file path
        coverLetter: coverLetter, // Store cover letter text
        appliedAt: Date.now()
      });

      // Save the application to the database
      await newApplication.save();

      // Respond to the client
      res.status(200).json({ message: 'Application submitted successfully', application: newApplication });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });
});
 
// Get Applications for a Job (Employers only)
app.get("/api/jobs/:id/applications", authenticate, async (req, res) => {
  if (req.user.role !== "employer") {
    return res.status(403).json({ error: "Access denied" });
  }

  try {
    // Find the job by ID
    const job = await Job.findById(req.params.id).populate({
      path: 'applications.jobSeekerId', // Populate jobSeekerId to get user details
      select: 'username resume coverLetter' // Specify fields to select
    });

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Prepare applications data for response
    const applicationsData = job.applications.map(application => ({
      jobSeekerId: application.jobSeekerId._id,
      username: application.jobSeekerId.username,
      coverLetter: application.coverLetter,
      resume: application.resume,
      // Add more fields as necessary
    }));

    res.json({ applications: applicationsData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});


// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port - ${PORT}`);
});
