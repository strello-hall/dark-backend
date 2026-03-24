const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // if you put your HTML in a "public" folder

// ====================== MongoDB Connection ======================
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// ====================== Counter Schema (for last code) ======================
const counterSchema = new mongoose.Schema({
    name: { type: String, default: 'memberCode' },
    seq: { type: Number, default: 0 }
});

const Counter = mongoose.model('Counter', counterSchema);

// ====================== Member Schema ======================
const memberSchema = new mongoose.Schema({
    code: { type: String, unique: true, required: true },
    memberName: { type: String, required: true },
    profileLink: { type: String, required: true },
    postLink1: String,
    postLink2: String,
    createdAt: { type: Date, default: Date.now }
});

const Member = mongoose.model('Member', memberSchema);

// ====================== Helper: Get Next Code ======================
async function getNextCode() {
    let counter = await Counter.findOneAndUpdate(
        { name: 'memberCode' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );

    const number = String(counter.seq).padStart(3, '0'); // 05-001, 05-002...
    return `05-${number}`;
}

// ====================== Routes ======================

// GET - Home (optional)
app.get("/", (req, res) => {
    res.send("Dark Squad Backend is running 🔥");
});

// POST - Add new member
app.post("/", async (req, res) => {
    try {
        const { memberName, profileLink, postLink1, postLink2 } = req.body;

        if (!memberName || !profileLink) {
            return res.status(400).json({ message: "اسم العضو ورابط البروفايل مطلوبان" });
        }

        // Generate next code
        const code = await getNextCode();

        // Save member
        const newMember = new Member({
            code,
            memberName,
            profileLink,
            postLink1: postLink1 || null,
            postLink2: postLink2 || null
        });

        await newMember.save();

        console.log(`✅ New member added: ${code} - ${memberName}`);

        // Return success with the code
        res.status(201).json({
            success: true,
            message: "تم إضافة العضو بنجاح",
            code: code,
            memberName: memberName,
            profileLink: profileLink
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "حدث خطأ في السيرفر" });
    }
});

// ====================== Start Server ======================
app.listen(PORT, () => {
    console.log(`🚀 Dark Squad Backend running on http://localhost:${PORT}`);
});