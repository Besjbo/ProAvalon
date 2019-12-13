var mongoose = require("mongoose");

var pinnedThreadSchema = mongoose.Schema({

	forumThread: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "forumThread"
		},
	},
});

module.exports = mongoose.model("pinnedThread", pinnedThreadSchema);