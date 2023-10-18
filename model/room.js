const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const roomSchema = Schema(
    {
        roomCode: {type:String, unique: true, required: true},
        tasks: {
            type: [
              {
                chore: {type:String,unique:false, required:false},
                createdBy: {type:String,unique:false, required: false},
                assignedTo: {type:String,unique:false, required:false},
                status: {type:String, unique:false, required:false}
              },
            ],
            required: false,
          },

            
    }
);

const Room = mongoose.model("tasks", roomSchema);

module.exports = Room;