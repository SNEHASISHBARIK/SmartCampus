const Note = require("../models/Note");
const Faculty = require("../models/Faculty");
const Subject = require("../models/Subject");

// CREATE NOTE
const createNote = async (req, res) => {
  try {
    const {
      title,
      description,
      subject,
      semester,
      fileUrl,
    } = req.body;

    if (!title || !subject || !semester || !fileUrl) {
      return res.status(400).json({
        success: false,
        message: "title, subject, semester and fileUrl are required",
      });
    }

    const faculty = await Faculty.findOne({
      user: req.user._id,
      status: "active",
    });

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty profile not found",
      });
    }

    const subjectData = await Subject.findOne({
      _id: subject,
      isActive: true,
    });

    if (!subjectData) {
      return res.status(404).json({
        success: false,
        message: "Subject not found or is inactive",
      });
    }

    // Auto-link faculty to subject if not assigned
    const isAssigned = Array.isArray(subjectData.faculty)
      ? subjectData.faculty.some(
          (assignedId) =>
            String(assignedId?._id || assignedId) === String(faculty._id)
        )
      : String(subjectData.faculty?._id || subjectData.faculty || "") ===
        String(faculty._id);

    if (!isAssigned) {
      if (!Array.isArray(subjectData.faculty)) {
        subjectData.faculty = subjectData.faculty ? [subjectData.faculty] : [];
      }
      subjectData.faculty.push(faculty._id);
      await subjectData.save();
    }

    const semesterValue = semester || subjectData.semester;

    const note = await Note.create({
      title,
      description,
      subject: subjectData._id,
      faculty: faculty._id,
      semester: semesterValue,
      fileUrl,
      status: "active",
    });

    const populatedNote = await Note.findById(note._id)
      .populate("subject", "name code semester department")
      .populate("faculty", "facultyId employeeId");

    res.status(201).json({
      success: true,
      message: "Note created successfully",
      note: populatedNote,
    });
  } catch (error) {
    console.error("Create note error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while creating note",
    });
  }
};


// GET FACULTY NOTES
const getNotes = async (req, res) => {
  try {
    const faculty = await Faculty.findOne({
      user: req.user._id,
      status: "active",
    });

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty profile not found",
      });
    }

    const filter = { faculty: faculty._id };
    if (req.query.subject) {
      filter.subject = req.query.subject;
    }

    const notes = await Note.find(filter)
      .populate("subject", "name code semester department")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: notes.length,
      notes,
    });
  } catch (error) {
    console.error("Get notes error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching notes",
    });
  }
};


// UPDATE NOTE
const updateNote = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      description,
      semester,
      fileUrl,
      status,
    } = req.body;

    const faculty = await Faculty.findOne({
      user: req.user._id,
      status: "active",
    });

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty profile not found",
      });
    }

    const note = await Note.findOne({
      _id: id,
      faculty: faculty._id,
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    if (title !== undefined) note.title = title;
    if (description !== undefined) note.description = description;
    if (semester !== undefined) note.semester = semester;
    if (fileUrl !== undefined) note.fileUrl = fileUrl;
    if (status !== undefined) note.status = status;

    await note.save();

    const updatedNote = await Note.findById(note._id)
      .populate("subject", "name code")
      .populate("faculty", "facultyId employeeId");

    res.status(200).json({
      success: true,
      message: "Note updated successfully",
      note: updatedNote,
    });
  } catch (error) {
    console.error("Update note error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while updating note",
    });
  }
};


// DELETE NOTE
const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;

    const faculty = await Faculty.findOne({
      user: req.user._id,
      status: "active",
    });

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty profile not found",
      });
    }

    const note = await Note.findOne({
      _id: id,
      faculty: faculty._id,
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    await Note.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Note deleted successfully",
    });
  } catch (error) {
    console.error("Delete note error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while deleting note",
    });
  }
};


module.exports = {
  createNote,
  getNotes,
  updateNote,
  deleteNote,
};