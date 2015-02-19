(function($){

	var Scratchpad = Scratchpad || {};

	Scratchpad = {

		settings : {
			pageTitle : $("#page-title"),
			content : $('#content'),
			toolbar : $('#toolbar'),
			saveBtn : $("#save"),
			clearBtn : $("#clear"),
			mssgBox : $("#messages"),
			saveLaterBtn : $("#save-later"),
			titleBox : $("#title-box"),
			titleInput : $("#title"),
			saveLaterConfirm : $("#save-later-confirm"),
			saveLaterCancel : $("#save-later-cancel"),
			titleMssg : $("#title-message"),
			notesList : $("#list-notes"),
			menu : $("#menu")
		},

		init : function () {
			settings = this.settings;
			Scratchpad.toggleMenu();
			Scratchpad.setPad("currentNote");
			Scratchpad.savePad();
			Scratchpad.clearPad();
			Scratchpad.saveConfirm();
			Scratchpad.loadItemsList();
			Scratchpad.bindEnterKey();
		},

		countObject : function (object) {
			var length = 0;

			for( var key in object ) {
				if( object.hasOwnProperty(key) ) {
					length++;
				}
			}

			return length;
		},

		getCount : function () {
			chrome.storage.sync.get("notesFolder", function(data) {
				settings.count = Scratchpad.countObject(data['notesFolder']) ? Scratchpad.countObject(data['notesFolder']) : 0;

				return settings.count;
			});
		},

		makeArray : function (obj) {
			var objCount = Scratchpad.countObject(obj),
				newArray = [];

			for (var i = 0; i < objCount + 1; i++) {
				if (obj[i]) {
					newArray.push(obj[i]);
				}
			}

			return newArray;
		},

		setPad : function (note) {
			// if(localStorage.getItem('content')) {
			//   settings.content.html(localStorage.getItem('content'));
			// }
			chrome.storage.sync.get(note, function(data) {
				if ( ! $.isEmptyObject(data) ) {
					settings.content.val(data[note]);

					if ( note !== 'currentNote') {
						settings.pageTitle.text(note);
					}
				}
			});
		},

		savePad : function () {
			settings.saveBtn.on( 'click.save', function (e) {
				var content = $('#content').val(),
					noteContents = {};

				e.preventDefault();

				// set currentNote key to note value
				noteContents["currentNote"] = content;

				// Save data using the Chrome extension storage API.
				chrome.storage.sync.set(noteContents, function(response) {
					// trigger confirmation on success
					settings.mssgBox.text("Note saved.").show().fadeOut(2500);
				});

			});
		},

		clearPad : function () {
			settings.clearBtn.on( "click", function (e) {
				e.preventDefault();
				// remove currentNote from storage
				chrome.storage.sync.remove("currentNote", function(data) {
					// empty notepad on success and display confirmation
					settings.pageTitle.text('New Tab Scratchpad');
					settings.mssgBox.text("Scratchpad cleared.").show().fadeOut(2500);
					settings.content.val('');
					Scratchpad.bindSave();
				});
			});
		},

		onSaveClick : function () {
			settings.saveLaterBtn.on( 'click', function () {
				return settings.titleBox.fadeIn(750).find("#title").focus();
			});
		},

		saveCancel : function () {
			settings.saveLaterCancel.on( 'click', function () {
				return settings.titleBox.fadeOut(750);
			});
		},

		saveConfirm : function () {
			Scratchpad.onSaveClick();
			Scratchpad.saveCancel();

			settings.saveLaterConfirm.on( "click", function () {
				var title = settings.titleInput.val(),
					body = settings.content.val(),
					note = {};

				if ( title.length ) {
					note[title] = body;
					chrome.storage.sync.set(note, function(response) {
						var title = settings.titleInput.val();
						settings.titleBox.empty().blur();
						settings.saveLaterConfirm.blur();
						Scratchpad.refreshItemsList();
						Scratchpad.onSaveClick();
						settings.pageTitle.text(title);
						Scratchpad.bindUpdate();
					});
				}
				else {
					settings.titleBox.addClass("error");
					settings.saveLaterConfirm.removeClass("btn-green").addClass("btn-red").blur();
					settings.saveLaterCancel.removeClass("btn-red").addClass("btn-green");
					settings.titleMssg.text("Title required.").show();
					return;
				}
			});
		},

		loadItemsList : function () {
			chrome.storage.sync.get(null, function (Notes) {
				$.each( Notes, function( key, value ) {
					if ( key !== 'currentNote') {
						qKey = key.replace(/’/g, "&rsquo;");

						var note = "<li class='notes-list-item'><div class='list-note-inner container'><span>"+key+"</span><button data-note-title='"+ qKey +"' class='btn-load-note button-inline btn-green'>Load</button><button data-note-title='"+ qKey +"' class='btn-delete-note button-inline btn-red'>Delete</button></div></li>";

						settings.notesList.append(note);
					}
				});
				Scratchpad.loadItem();
				Scratchpad.addListClasses();
				Scratchpad.deleteItem();
			});
		},

		addListClasses : function () {
			var notes = settings.notesList.find('li');

			notes.each( function(i) {
				$(this).addClass('notes-list-item-' + (i+1));
			});
		},

		refreshItemsList : function () {
			settings.notesList.empty();
			Scratchpad.loadItemsList();
		},

		loadItem : function () {
			$(".btn-load-note").on( "click", function() {
				var title = $(this).attr('data-note-title');
				Scratchpad.setPad(title);
				Scratchpad.bindUpdate();
			});
		},

		bindUpdate : function () {
			settings.saveBtn
				.off('click.save')
				.text('Update')
				.on('click.update', function(e) {
					var title = settings.pageTitle.text(),
						body = settings.content.val(),
						note = {};

					e.preventDefault();

					note[title] = body;
					chrome.storage.sync.set(note, function() {
						Scratchpad.refreshItemsList();
					});
				});
		},

		bindSave : function () {
			settings.saveBtn.text('Save');
			Scratchpad.savePad();
		},

		deleteItem : function () {
			$('.btn-delete-note').on( "click", function () {
				var title = $(this).attr('data-note-title');
				chrome.storage.sync.remove(title, function(data) {
					// empty notepad on success and display confirmation
					Scratchpad.refreshItemsList();
					settings.mssgBox.text("Note deleted.").show().fadeOut(2500);
				});
			});
		},

		toggleMenu : function() {
			settings.menu.on("click", function(e) {
				e.preventDefault();
				if ( $("body").hasClass("menu-active") ) {
					$("body").removeClass("menu-active");
					settings.menu.text('Menu').blur();
				}
				else {
					$("body").addClass("menu-active");
					settings.menu.text('Close').blur();
				}
			});
		},

		bindEnterKey : function () {
			settings.titleInput.keyup( function(e) {
				if(e.keyCode == 13) {
					$(this).trigger("enterKey");
				}
			});

			settings.titleInput.on( "enterKey", function() {
				return settings.saveLaterConfirm.click();
			});
		},

	};

	Scratchpad.init();

})(jQuery);