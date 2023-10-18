const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./model/user');
const Room = require('./model/room');
const app = express();

mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.0ah6d5f.mongodb.net/DoItTogether?retryWrites=true&w=majority`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('database connection successful')
});

app.use(cors());
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.post("/login", async (req, res) => {
    const errors = {};
    console.log('email', req.body.email, req.body.password);
    User.findOne({ email: req.body.email }).then((user) => {
        console.log(user);
        if (!user) {
            const re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            console.log(re.test(req.body.email));
            if (!re.test(req.body.email)) {
                errors.message = "email is incorrect";
                return res.status(400).json(errors);
            }
            if (req.body.password.length < 6) {
                errors.message = "Password length must be greater than 6 characters";
                return res.status(400).json(errors);
            }
            const newUser = User({
                email: req.body.email,
                password: req.body.password,
            });
            bcrypt.genSalt(10, (err, salt) => {
                if (err) {
                    console.log(error);
                    res.status(400).json(err);
                }
                bcrypt.hash(newUser.password, salt, (err, hash) => {
                    newUser.password = hash;
                    newUser.save().then(() => {
                        console.log("user is successfully registered");
                        res.json({ message: "User registration is successful" });
                    });
                });
            });
        }
        else {
            bcrypt.compare(req.body.password, user.password, (err, match) => {
                if (err) {
                    console.log(err);
                    return res.json(err);
                }
                if (!match) {
                    errors.message = "Password entered is incorrect";
                    return res.status(402).json(errors);
                }
                const payload = { name: user.name, email: user.email };
                jwt.sign(
                    payload,
                    process.env.JWT_SECRET,
                    { expiresIn: "1h" },
                    (err, token) => {
                        console.log("token', ", token);
                        res.json({ message: "success", token: `${token}` });
                    }
                );
            });
        }
    });
});

app.post('/create', async (req, res) => {
    console.log('req.body', req.body);
    Room.findOne({ roomCode: req.body.roomCode }).then((room) => {
        if(room) {
            res.json({message: "Room Already exist with this code"})
        }
        else {
            const newRoom = new Room({
                roomCode: req.body.roomCode,
                tasks: [{chore: req.body.chore, assignedTo: req.body.assignedTo, createdBy: req.body.createdBy, status:'assigned'}],
            });
            newRoom.save().then(() => {
                console.log("Room saved successfully");
                res.json({ message: "Room created Successfully" });
            });
        }
    })

})

app.post('/validate', async (req, res) => {
    console.log('req.bodyyy', req.body);
    Room.findOne({ roomCode: req.body.roomCode}).then((room) => {
        if(room) {
            res.json({message: "Room found"})
        }
        else {
            res.json({message: "No Room found"})
        }
    })
})

app.post('/get-tasks', async (req, res) => {
    try {
        console.log("room code: ", req.body.roomCode);
        const room = await Room.findOne({ roomCode: req.body.roomCode });
        console.log('room', room);
        if (!room) {
            return res.json({ message: "No Room found" });
        }
        console.log('room data:', room);
        res.json(room)
    } catch (error) {
        console.error('Error fetching room data:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

app.post('/add', async (req, res) => {
    console.log('req.bodydddd', req.body);
    try {
        console.log("room code: ", req.body.roomCode);
        const room = await Room.findOne({ roomCode: req.body.roomCode });
        console.log('room2222', room);
        if (!room) {
            return res.json({ message: "No Room found" });
        }
        room.tasks.push({chore:req.body.chore, createdBy: req.body.createdBy, assignedTo: req.body.assignedTo, status: req.body.status});
        await room.save();
        res.json({message: "Chore added successfully"});
        
    } catch (error) {
        res.status(500).json({message: "Internal server error"})
    }
});

app.post('/delete', async (req, res) => {
    try {
    console.log('delete', req.body);
    let index = req.body.index;
    const room = await Room.findOne({roomCode: req.body.roomCode});
    console.log("room1", room);
    if(!room) {
        return res.json({message: 'Error in deleting. Please try again later!'})
    }
    console.log('daataaaa', index, room.tasks.length);
    if (index < 0 || index >= room.tasks.length) {
        return res.status(400).json({ message: 'Invalid index.' });
    }
    room.tasks.splice(index, 1);
    console.log("roomddddd", room);
    room.save().then(response => {
        console.log("response", response);
        res.json({message: "Task deleted successfully"});
    }).catch(err => {
        console.log('err', err);
        res.json({message: "Task could not be deleted. Please try again later!"})
    })
    } catch (error) {
        res.status(500).json({message : "Internal server error"})
    }
    
})

app.post('/update', async (req, res) => {
    console.log('req.bodydddd', req.body);
    const index = req.body.index;
    try {
        console.log("room code: ", req.body.roomCode);
        const room = await Room.findOne({ roomCode: req.body.roomCode });
        console.log('room2222', room);
        if (!room) {
            return res.json({ message: "No Room found" });
        }
        console.log('taskssss', room.tasks);
        console.log('wanted', room.tasks[index]['status']);
        room.tasks[index]['status'] = req.body.updatedStatus;
        await room.save();
        res.json({message: "Chore updated successfully"});
        
    } catch (error) {
        res.status(500).json({message: "Internal server error"})
    }
});

app.get('/asdf', (req, res) => {
    return (
        res.send({
            msg: 'asdfasdfasdafasdfasdf'
        })
    )
})



app.listen(process.env.PORT, () => {
    console.log(`listening on PORT ${process.env.PORT}`)
})