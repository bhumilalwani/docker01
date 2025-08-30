const mongoose= require('mongoose');
mongoose.connect(`mongodb://127.0.0.1:27017/jwtauthapp`);

const userSchema=mongoose.Schema({
    username: String,
    email:String,
    password:String,
    age:Number,
    loginToken: String,
  loginTokenExpires: Date,
});
module.exports=mongoose.model("user", userSchema);