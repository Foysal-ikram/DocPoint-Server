const express = require('express') ;
const cors = require('cors') ;
const app = express() ;
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 5000 ;

require('dotenv').config() ;


app.use(cors()) ;
app.use(express.json()) 

app.get('/' , (req,res)=>{
    res.send('Doctors api running');

} )

app.listen(port , ()=>console.log(port))


function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.send(401).send({ message: 'unauthorized ' })

    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.Token, function (err, decoded) {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access' });
        }
        req.decoded = decoded;
        next();
    })

}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.tngy8ld.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try{
        const serviceCollection = client.db('docpoint').collection('slots');
        const appointmentCollection = client.db('docpoint').collection('appointments');
        const userCollection = client.db('docpoint').collection('users')


        app.get('/slots' , async (req,res)=>{
            const date = req.query.date ;
            const query ={} ;

            //getting the bookings for selected Date>>
            const bookingQuery ={appointmentDate: date}
            //console.log(bookingQuery)
            const options = await serviceCollection.find(query).toArray();
            // console.log(options)
            const alreadybooked = await appointmentCollection.find(bookingQuery).toArray() ;
            // console.log(alreadybooked)

            // For each treatment option >>> 1. get booked treatment each option 2.select booked treatmentoption
            // 3. Get only that slots whics are booked for each treatmentoption  4. Find remaining slots
            options.forEach(option=>{
               const optionBooked = alreadybooked.filter(booking => booking.treatment === option.name )
               const bookedSlots = optionBooked.map(booking => booking.slot)
               const remainingSlots = option.slots.filter(slot=> !bookedSlots.includes(slot))
               option.slots = remainingSlots ;
            //    console.log(date , option.name , remainingSlots.length)
            })
            res.send(options)
        })


        app.post('/slots' , async (req,res)=>{
            const appointment = req.body;
            console.log(appointment)
            const result = await appointmentCollection.insertOne(appointment);
           // console.log(appointment) ;
            res.send(result)
        })

        app.get('/bookings' , async (req,res)=>{
            const email = req.query.email ;
            const query = {email: email} ;
            const bookings = await appointmentCollection.find(query).toArray() ;
            res.send(bookings)

        })

        app.post('/user' , async (req,res)=>{
            const user = req.body ;
            console.log(user)
            const result =  await userCollection.insertOne(user) ;
            res.send(result) 
        })
    }
    finally{

    }

}
run().catch(console.dir) ;
