const express = require("express");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middle ware
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
// QWSCdzJXq1pl2C6J
// carDoctorClient

const uri = `mongodb+srv://${process.env.S3_BUCKET}:${process.env.SECRET_KEY}@cluster0.qlha3qo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// won url
const logger = async (req, res, next) => {
  console.log("called", req.host, req.originalUrl);
  next();
};
// verify token

const verifyToken = async (req, res, next) => {
  const token = req.cookie?.token;
  if (!token) {
    return res.status(401).send({ massage: "forbidden verify token" });
  }
  jwt.verifyToken(token, process.env.ACCESS_TOKEN_SECRET, (err, decode) => {
    if (err) {
      console.log("error");
      return res.status(401).send({ massage: "Unauthorize" });
    }
    console.log("value is the token", decode);
    req.user = decode;

    next();
  });
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const servicesCollection = client
      .db("CardoctorClient")
      .collection("services");
    const bookingCollection = client
      .db("CardoctorClient")
      .collection("booking");

    // json web token

    app.post("jwt", async (req, res) => {
      const user = req.body;
      console.log("user toeken ", user);
      const token = jwt.sign(user, ACCESS_TOKEN_SECRET, { expiresIn: "1h" });
      console.log(token);
    });

    // web token
    // app.post("/jwt", logger, async (req, res) => {
    //   const user = req.body;

    //   console.log(user);
    //   const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    //     expiresIn: "1h",
    //   });
    //   res
    //     .cookie("token", token, {
    //       httpOnly: true,
    //       secure: false,
    //     })
    //     .send({ success: true });
    // });

    // get methood
    app.get("/services", logger, async (req, res) => {
      const cursor = servicesCollection.find();
      const result = await cursor.toArray();
      console.log(result);
      res.send(result);
    });

    // get id methood
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const options = {
        // Include only the `title` and `imdb` fields in the returned document
        projection: { _id: 0, title: 1, price: 1, service_id: 1, img: 1 },
      };
      const result = await servicesCollection.findOne(query, options);
      res.send(result);
    });

    // app.get
    app.get("/booking", async (req, res) => {
      console.log(req.query.email);
      // // console.log("tok tok token", req.cookies.token);
      // console.log("user form valid token", req.user);
      // if (req.query?.email !== req.user?.email) {
      //   return res.status(403).send({ massage: "forbidden access" });
      // }
      let query = {};
      if (req.query?.email) {
        query = { email: req.query?.email };
      }
      const result = await bookingCollection.find(query).toArray();
      // console.log(result);
      res.send(result);
    });

    app.patch("/booking/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedBooking = req.body;
      console.log(updatedBooking);
      const updateDoc = {
        $set: {
          status: updatedBooking.status,
        },
      };
      const result = await bookingCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // app.post
    app.post("/booking", logger, async (req, res) => {
      const booking = req.body;
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    });
    // delete one

    app.delete("/booking/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("the service is running");
});

app.listen(port, () => {
  console.log(`the port is running on his port ${port}`);
});
