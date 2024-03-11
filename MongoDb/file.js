const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');
const { userInfo } = require('os');
const app = express()
const port = 3000;
const url = 'mongodb://0.0.0.0/';
const Entry = mongoose.model('Entry', { _id: Number, name: String, password: String });
const LoginEntry = mongoose.model('LoginEntry', { _id: Number, password: String });

const client = new MongoClient(url);
app.use(bodyParser.urlencoded({ extended: true }));
const usercrendential =[]

const dbName = 'porfolio';
const collectionName = 'skill';

app.set('view engine', 'ejs');
app.set(__dirname+'/home.ejs');

const database = client.db(dbName);
const collection = database.collection(collectionName);
const data = collection.find({}).toArray();
async function connectToMongoDB(userEntry) {
    try {
        await client.connect();
        console.log('Connected to MongoDB server');
        const database = client.db(dbName);
        const collection = database.collection(collectionName);
        const result = await collection.insertOne(userEntry);
        console.log('Data inserted successfully');
    } catch (error) {
        if (error.code === 11000) {
            console.error('Duplicate key error: _id already exists');
            return 'Duplicate key error: _id already exists';
        } else {
            console.error('Error connecting to MongoDB:', error);
        }
    } finally {
        await client.close();
        console.log('Connection closed');
    }
}

app.get('/', async (req, res)=>{
    res.sendFile(__dirname + '/index.html');

})

app.get('/indexerror', async (req, res)=>{
    res.sendFile(__dirname + '/indexerror.html');
    
})

app.post('/submit', async (req, res) => {
    try {
        // Clear the usercrendential array before pushing new credentials
        usercrendential.length = 0;

        await usercrendential.push({
            _id: req.body._id,
            name: req.body.name,
            password: req.body.password
        });
        const userEntry = Entry({
            _id: req.body._id,
            name: req.body.name,
            password: req.body.password
        });
        console.log(userEntry);
        const result = await connectToMongoDB(userEntry);
        if (result === 'Duplicate key error: _id already exists') {
            // Send a message to the user indicating duplicate key error
            return res.sendFile(__dirname + '/indexerror.html');
        }
        res.sendFile(__dirname + '/login.html');
    } catch (e) {
        res.sendFile(__dirname + '/index.html');
    }
});
app.post('/logged', async (req,res)=>{
    const userEntry = new LoginEntry({
        _id: req.body._id,
        password: req.body.password
    });
    try {
        await client.connect();
        console.log('Connected to MongoDB server');
        const database = client.db(dbName);
        const collection = database.collection(collectionName);
        const cursor = collection.find(userEntry);
        const documents = await cursor.toArray();
        const data = await collection.find({}).toArray();
        const count = await collection.countDocuments();
        if (documents.length > 0) {
            console.log('Login Successfully');
            res.render(__dirname+'/home.ejs',{data: data, count: count});
            // You may want to perform additional actions here if login is successful
        } else {
            console.log('Login Failed: No matching user found');
            res.sendFile(__dirname+'/loginerror.html')
            // You can return a message or take other actions if login fails
        }
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        res.sendFile(__dirname+'/login.html')
    } finally {
        await client.close();
        console.log('Connection closed');
    }

});

app.get('/login', async (req,res)=>{
    res.sendFile(__dirname + '/login.html');
});

app.get('/data', async (req, res) => {
    try {
        await client.connect();
        console.log('Connected to MongoDB server');
        const database = client.db(dbName);
        const collection = database.collection(collectionName);
        const data = await collection.find({}).toArray();
        res.json(data);
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        await client.close();
        console.log('Connection closed');
    }
});

app.delete('/delete/:id', async (req, res) => {
    const id = new LoginEntry({
       _id : req.params.id
    })
    try {
        await client.connect();
        console.log('Connected to MongoDB server');

        const database = client.db(dbName);
        const collection = database.collection(collectionName);

        const result = await collection.deleteOne(id); // Convert id to ObjectId
        if (result.deletedCount === 1) {
            console.log('Entry deleted successfully');
            res.json({ message: 'Entry deleted successfully' });
        } else {
            console.log('Entry not found');
            res.status(404).json({ error: 'Entry not found' });
        }
    } catch (error) {
        console.error('Error deleting entry:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        await client.close();
        console.log('Connection closed');
    }
});

// Route to handle update request
app.put('/update/:id/:newName/:newPassword', async (req, res) => {
    const id = new LoginEntry({
        _id : req.params.id
     })
    const newName = req.params.newName;
    const newPassword = req.params.newPassword;
    try {
        // Connect to MongoDB
        await client.connect();
        // Access the database and collection
        const database = client.db(dbName);
        const collection = database.collection(collectionName);

        // Construct the update object
        const update = {
            $set: {
                name: newName,
                password: newPassword
            }
        };

        // Update the document
        const result = await collection.updateOne( id , update);
        if (result.modifiedCount === 1) {
            console.log('Entry updated successfully');
            res.json({ message: 'Entry updated successfully' });
        } else {
            console.log('Entry not found');
            res.status(404).json({ error: 'Entry not found' });
        }
    } catch (error) {
        console.error('Error updating entry:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        // Close the MongoDB connection
        await client.close();
    }
});

app.listen(port, () => {                      
    console.log(`Server is running on http://localhost:${port}`);
});
