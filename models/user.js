import mongoose from "mongoose";


const userSchema=mongoose.Schema({
    username: String,
    email:String,
    password:String,
    age:Number,
    loginToken: String,
  loginTokenExpires: Date,
});
const user =mongoose.model("user", userSchema);

export default user;