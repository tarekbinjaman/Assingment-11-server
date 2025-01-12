
require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cookieParser = require('cookie-parser');
const port = process.env.PORT || 5000;
const app = express();


app.use(express.json());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://assingment-11-bd947.web.app',
    'https://assingment-11-bd947.firebaseapp.com'
    ],
  credentials: true
}));
app.use(cookieParser());

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token; // Check if token exists in cookies

  if (!token) {
    return res.status(401).send({ message: 'Unauthorized access - No token' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      const errorMessage = err.name === 'TokenExpiredError' 
        ? 'Token expired' 
        : 'Invalid token';
      return res.status(401).send({ message: errorMessage });
    }

    req.user = decoded; // Save decoded payload to `req.user`
    next();
  });
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vkwnn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const jobcollection = client.db('serviceDB').collection('serviceCollection');
    const reviewcollection = client.db('serviceDB').collection('reviewCollection');
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");


    // Service api 

    // create
    app.post('/services', async(req, res) => {
        const newService = req.body;
        console.log(newService);
        const result = await jobcollection.insertOne(newService);
        res.send(result);
    })

    // read
    app.get('/services', async (req, res) => {
          const email = req.query.email; // Extract email from query parameters
          const query = email ? { email } : {}; // If email exists, query by email; otherwise, return all services
          const cursor = jobcollection.find(query); // Query the database
          const result = await cursor.toArray(); // Convert the result to an array
          res.send(result); // Send the result to the client
  });
  

    // read singer data
    app.get('/services/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await jobcollection.findOne(query);
      res.send(result)
    })

    app.delete('/services/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await jobcollection.deleteOne(query)
      res.send(result);

    })
    app.put('/services/:id', async(req, res) => {
      const id = req.params.id;
      const updateServ = req.body;
      const options = {upsert : true};
      const query = {_id: new ObjectId(id)}

      const updateService = {
        $set : {
          serviceImage: updateServ.serviceImage,
          title: updateServ.title,
          companyName: updateServ.companyName,
          website: updateServ.website,
          description: updateServ.description,
          category: updateServ.category,
          price: updateServ.price,
        }
      }

      const result = await jobcollection.updateOne(query, updateService, options)
      res.send(result);

    })

    // review api


    app.put('/review/:id', async(req, res) => {
      const id = req.params.id;
      const updateReview = req.body;
      const options = {upsert : true};

      const query = {_id: new ObjectId(id)}
      const updateRev = {
        $set: {
          review: updateReview.review,
          rating: updateReview.rating,
        },
      };
      const result = await reviewcollection.updateOne(query, updateRev, options)
      res.send(result);

    })

    app.post('/review', async(req, res) => {
      const newReview = req.body;
      console.log(newReview);
      const result = await reviewcollection.insertOne(newReview);
      res.send(result);
    })

    app.get('/review', async (req, res) => {
      const email = req.query.email;
    
      try {
        const query = email ? { email } : {};
        const cursor = reviewcollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        console.error('Error fetching reviews:', error.message);
        res.status(500).send({ error: 'Failed to fetch reviews' });
      }
    });
    
    

    app.get('/review/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await reviewcollection.findOne(query);
      res.send(result);
    })

    app.delete('/review/:id', async (req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await reviewcollection.deleteOne(query)
      res.send(result);
    })

    // jwt 
    app.post('/jwt', async(req, res) => {
      const user = req.body;
      const token = jwt.sign({email: user.email}, process.env.JWT_SECRET, {expiresIn: '1h'});
      res
      .cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      })
      .send(token);
    })




    

  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Assingment-11 Database is running')
})

app.listen(port, () => {
    console.log(`THis database is going on: ${port}`);
})