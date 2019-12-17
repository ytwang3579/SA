/**
 * ownCloud
 *
 * @author Bartek Przybylski, Christopher Schäpers, Thomas Tanghus
 * @copyright 2012 Bartek Przybylski bartek@alefzero.eu
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU AFFERO GENERAL PUBLIC LICENSE
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU AFFERO GENERAL PUBLIC LICENSE for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with this library.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

/* global alert */

/**
 * this class to ease the usage of jquery dialogs
 * @lends OC.dialogs
 */
var OCdialogs = {
	// dialog button types
	YES_NO_BUTTONS:		70,
	OK_BUTTONS:		71,

	FILEPICKER_TYPE_CHOOSE: 1,
	FILEPICKER_TYPE_MOVE: 2,
	FILEPICKER_TYPE_COPY: 3,
	FILEPICKER_TYPE_COPY_MOVE: 4,

	// used to name each dialog
	dialogsCounter: 0,
	/**
	* displays alert dialog
	* @param text content of dialog
	* @param title dialog title
	* @param callback which will be triggered when user presses OK
	* @param modal make the dialog modal
	*/
	alert:function(text, title, callback, modal) {
		this.message(
			text,
			title,
			'alert',
			OCdialogs.OK_BUTTON,
			callback,
			modal
		);
	},
	/**
	* displays info dialog
	* @param text content of dialog
	* @param title dialog title
	* @param callback which will be triggered when user presses OK
	* @param modal make the dialog modal
	*/
	info:function(text, title, callback, modal) {
		this.message(text, title, 'info', OCdialogs.OK_BUTTON, callback, modal);
	},
	/**
	* displays confirmation dialog
	* @param text content of dialog
	* @param title dialog title
	* @param callback which will be triggered when user presses YES or NO
	*        (true or false would be passed to callback respectively)
	* @param modal make the dialog modal
	*/
	confirm:function(text, title, callback, modal) {
		return this.message(
			text,
			title,
			'notice',
			OCdialogs.YES_NO_BUTTONS,
			callback,
			modal
		);
	},
	/**
	* displays confirmation dialog
	* @param text content of dialog
	* @param title dialog title
	* @param callback which will be triggered when user presses YES or NO
	*        (true or false would be passed to callback respectively)
	* @param modal make the dialog modal
	*/
	confirmHtml:function(text, title, callback, modal) {
		return this.message(
			text,
			title,
			'notice',
			OCdialogs.YES_NO_BUTTONS,
			callback,
			modal,
			true
		);
	},
	/**
	 * displays prompt dialog
	 * @param text content of dialog
	 * @param title dialog title
	 * @param callback which will be triggered when user presses YES or NO
	 *        (true or false would be passed to callback respectively)
	 * @param modal make the dialog modal
	 * @param name name of the input field
	 * @param password whether the input should be a password input
	 */
	prompt: function (text, title, callback, modal, name, password) {
		return $.when(this._getMessageTemplate()).then(function ($tmpl) {
			var dialogName = 'oc-dialog-' + OCdialogs.dialogsCounter + '-content';
			var dialogId = '#' + dialogName;
			var $dlg = $tmpl.octemplate({
				dialog_name: dialogName,
				title      : title,
				message    : text,
				type       : 'notice'
			});
			var input = $('<input/>');
			input.attr('type', password ? 'password' : 'text').attr('id', dialogName + '-input').attr('placeholder', name);
			var label = $('<label/>').attr('for', dialogName + '-input').text(name + ': ');
			$dlg.append(label);
			$dlg.append(input);
			if (modal === undefined) {
				modal = false;
			}
			$('body').append($dlg);

			// wrap callback in _.once():
			// only call callback once and not twice (button handler and close
			// event) but call it for the close event, if ESC or the x is hit
			if (callback !== undefined) {
				callback = _.once(callback);
			}

			var buttonlist = [{
					text : t('core', 'No'),
					click: function () {
						if (callback !== undefined) {
							callback(false, input.val());
						}
						$(dialogId).ocdialog('close');
					}
				}, {
					text         : t('core', 'Yes'),
					click        : function () {
						if (callback !== undefined) {
							callback(true, input.val());
						}
						$(dialogId).ocdialog('close');
					},
					defaultButton: true
				}
			];

			$(dialogId).ocdialog({
				closeOnEscape: true,
				modal        : modal,
				buttons      : buttonlist,
				close        : function() {
					// callback is already fired if Yes/No is clicked directly
					if (callback !== undefined) {
						callback(false, input.val());
					}
				}
			});
			input.focus();
			OCdialogs.dialogsCounter++;
		});
	},
	/**
	 * show a file picker to pick a file from
	 *
	 * In order to pick several types of mime types they need to be passed as an
	 * array of strings.
	 *
	 * When no mime type filter is given only files can be selected. In order to
	 * be able to select both files and folders "['*', 'httpd/unix-directory']"
	 * should be used instead.
	 *
	 * @param title dialog title
	 * @param callback which will be triggered when user presses Choose
	 * @param multiselect whether it should be possible to select multiple files
	 * @param mimetypeFilter mimetype to filter by - directories will always be included
	 * @param modal make the dialog modal
	 * @param type Type of file picker : Choose, copy, move, copy and move
	 * @param path path to the folder that the the file can be picket from
	*/
	filepicker:function(title, callback, multiselect, mimetypeFilter, modal, type, path) {
		var self = this;

		this.filepicker.sortField = 'name';
		this.filepicker.sortOrder = 'asc';
		// avoid opening the picker twice
		if (this.filepicker.loading) {
			return;
		}

		if (type === undefined) {
			type = this.FILEPICKER_TYPE_CHOOSE;
		}

		var emptyText = t('core', 'No files in here');
		var newText = t('files', 'New folder');
		if (type === this.FILEPICKER_TYPE_COPY || type === this.FILEPICKER_TYPE_MOVE || type === this.FILEPICKER_TYPE_COPY_MOVE) {
			emptyText = t('core', 'No more subfolders in here');
		}

		this.filepicker.loading = true;
		this.filepicker.filesClient = (OCA.Sharing && OCA.Sharing.PublicApp && OCA.Sharing.PublicApp.fileList)? OCA.Sharing.PublicApp.fileList.filesClient: OC.Files.getClient();

		this.filelist = null;
		path = path || '';

		$.when(this._getFilePickerTemplate()).then(function($tmpl) {
			self.filepicker.loading = false;
			var dialogName = 'oc-dialog-filepicker-content';
			if(self.$filePicker) {
				self.$filePicker.ocdialog('close');
			}

			if (mimetypeFilter === undefined || mimetypeFilter === null) {
				mimetypeFilter = [];
			}
			if (typeof(mimetypeFilter) === "string") {
				mimetypeFilter = [mimetypeFilter];
			}

			self.$filePicker = $tmpl.octemplate({
				dialog_name: dialogName,
				title: title,
				emptytext: emptyText,
				newtext: newText,
				nameCol: t('core', 'Name'),
				sizeCol: t('core', 'Size'),
				modifiedCol: t('core', 'Modified')
			}).data('path', path).data('multiselect', multiselect).data('mimetype', mimetypeFilter);

			if (modal === undefined) {
				modal = false;
			}
			if (multiselect === undefined) {
				multiselect = false;
			}

			// No grid for IE!
			if (OC.Util.isIE()) {
				self.$filePicker.find('#picker-view-toggle').remove();
				self.$filePicker.find('#picker-filestable').removeClass('view-grid');
			}

			$('body').append(self.$filePicker);

			self.$showGridView = $('input#picker-showgridview');
			self.$showGridView.on('change', _.bind(self._onGridviewChange, self));

			if (!OC.Util.isIE()) {
				self._getGridSettings();
			}

			var newButton = self.$filePicker.find('.actions.creatable .button-add');
			if (type === self.FILEPICKER_TYPE_CHOOSE) {
				newButton.hide();
			}
			newButton.on('focus', function() {
				self.$filePicker.ocdialog('setEnterCallback', function() {
					event.stopImmediatePropagation();
					event.preventDefault();
					newButton.click();
				});
			});
			newButton.on('blur', function() {
				self.$filePicker.ocdialog('unsetEnterCallback');
			});

			OC.registerMenu(newButton,self.$filePicker.find('.menu'),function () {
				$input.focus();
				self.$filePicker.ocdialog('setEnterCallback', function() {
					event.stopImmediatePropagation();
					event.preventDefault();
					self.$form.submit();
				});
				var newName = $input.val();
				var lastPos = newName.lastIndexOf('.');
				if (lastPos === -1) {
					lastPos = newName.length;
				}
				$input.selectRange(0, lastPos);
			});
			var $form = self.$filePicker.find('.filenameform');
			var $input = $form.find('input[type=\'text\']');
			var $submit = $form.find('input[type=\'submit\']');
			$submit.on('click',function(event) {
				event.stopImmediatePropagation();
				event.preventDefault();
				$form.submit();
			});

			var checkInput = function () {
				var filename = $input.val();
				try {
					if (!Files.isFileNameValid(filename)) {
						// Files.isFileNameValid(filename) throws an exception itself
					} else if (self.filelist.find(function(file){return file.name === this;},filename)) {
						throw t('files', '{newName} already exists', {newName: filename}, undefined, {
							escape: false
						});
					} else {
						return true;
					}
				} catch (error) {
					$input.attr('title', error);
					$input.tooltip({placement: 'right', trigger: 'manual', 'container': '.newFolderMenu'});
					$input.tooltip('fixTitle');
					$input.tooltip('show');
					$input.addClass('error');
				}
				return false;
			};

			$form.on('submit', function(event) {
				event.stopPropagation();
				event.preventDefault();

				if (checkInput()) { 
					var newname = $input.val();
					self.filepicker.filesClient.createDirectory(self.$filePicker.data('path') + "/" + newname).always(function (status) {
						self._fillFilePicker(self.$filePicker.data('path') + newname );
					});
					OC.hideMenus();
					self.$filePicker.ocdialog('unsetEnterCallback');
					self.$filePicker.click();
					$input.val(newText);
				}
			});
			$input.keypress(function(event) {
				if (event.keyCode === 13 || event.which === 13) {
					event.stopImmediatePropagation();
					event.preventDefault();
					$form.submit();
				}
			});

			self.$filePicker.ready(function() {
				self.$fileListHeader = self.$filePicker.find('.filelist thead tr');
				self.$filelist = self.$filePicker.find('.filelist tbody');
				self.$filelistContainer = self.$filePicker.find('.filelist-container');
				self.$dirTree = self.$filePicker.find('.dirtree');
				self.$dirTree.on('click', 'div:not(:last-child)', self, function (event) {
					self._handleTreeListSelect(event, type);
				});
				self.$filelist.on('click', 'tr', function(event) {
					self._handlePickerClick(event, $(this), type);
				});
				self.$fileListHeader.on('click', 'a', function(event) {
					var dir = self.$filePicker.data('path');
					self.filepicker.sortField = $(event.currentTarget).data('sort');
					self.filepicker.sortOrder = self.filepicker.sortOrder === 'asc' ? 'desc' : 'asc';
					self._fillFilePicker(dir);
				});
				self._fillFilePicker(path);
			});

			// build buttons
			var functionToCall = function(returnType) {
				if (callback !== undefined) {
					var datapath;
					if (multiselect === true) {
						datapath = [];
						self.$filelist.find('tr.filepicker_element_selected').each(function(index, element) {
							datapath.push(self.$filePicker.data('path') + '/' + $(element).data('entryname'));
						});
					} else {
						datapath = self.$filePicker.data('path');
						var selectedName = self.$filelist.find('tr.filepicker_element_selected').data('entryname');
						if (selectedName) {
							datapath += '/' + selectedName;
						}
					}
					callback(datapath, returnType);
					self.$filePicker.ocdialog('close');
				}
			};

			var chooseCallback = function () {
				functionToCall(OCdialogs.FILEPICKER_TYPE_CHOOSE);
			};

			var copyCallback = function () {
				functionToCall(OCdialogs.FILEPICKER_TYPE_COPY);
			};

			var moveCallback = function () {
				functionToCall(OCdialogs.FILEPICKER_TYPE_MOVE);
			};

			var buttonlist = [];
			if (type === OCdialogs.FILEPICKER_TYPE_CHOOSE) {
				buttonlist.push({
					text: t('core', 'Choose'),
					click: chooseCallback,
					defaultButton: true
				});
			} else {
				if (type === OCdialogs.FILEPICKER_TYPE_COPY || type === OCdialogs.FILEPICKER_TYPE_COPY_MOVE) {
					buttonlist.push({
						text: t('core', 'Copy'),
						click: copyCallback,
						defaultButton: false
					});
				}
				if (type === OCdialogs.FILEPICKER_TYPE_MOVE || type === OCdialogs.FILEPICKER_TYPE_COPY_MOVE) {
					buttonlist.push({
						text: t('core', 'Move'),
						click: moveCallback,
						defaultButton: true
					});
				}
			}

			self.$filePicker.ocdialog({
				closeOnEscape: true,
				// max-width of 600
				width: 600,
				height: 500,
				modal: modal,
				buttons: buttonlist,
				style: {
					buttons: 'aside',
				},
				close: function() {
					try {
						$(this).ocdialog('destroy').remove();
					} catch(e) {}
					self.$filePicker = null;
				}
			});

			// We can access primary class only from oc-dialog.
			// Hence this is one of the approach to get the choose button.
			var getOcDialog = self.$filePicker.closest('.oc-dialog');
			var buttonEnableDisable = getOcDialog.find('.primary');
			if (self.$filePicker.data('mimetype').indexOf("httpd/unix-directory") !== -1) {
				buttonEnableDisable.prop("disabled", false);
			} else {
				buttonEnableDisable.prop("disabled", true);
			}
		})
		.fail(function(status, error) {
			// If the method is called while navigating away
			// from the page, it is probably not needed ;)
			self.filepicker.loading = false;
			if(status !== 0) {
				alert(t('core', 'Error loading file picker template: {error}', {error: error}));
			}
		});
	},
	/**
	 * Displays raw dialog
	 * You better use a wrapper instead ...
	*/
	message:function(content, title, dialogType, buttons, callback, modal, allowHtml) {
		return $.when(this._getMessageTemplate()).then(function($tmpl) {
			var dialogName = 'oc-dialog-' + OCdialogs.dialogsCounter + '-content';
			var dialogId = '#' + dialogName;
			var $dlg = $tmpl.octemplate({
				dialog_name: dialogName,
				title: title,
				message: content,
				type: dialogType
			}, allowHtml ? {escapeFunction: ''} : {});
			if (modal === undefined) {
				modal = false;
			}
			$('body').append($dlg);
			var buttonlist = [];
			switch (buttons) {
			case OCdialogs.YES_NO_BUTTONS:
				buttonlist = [{
					text: t('core', 'No'),
					click: function(){
						if (callback !== undefined) {
							callback(false);
						}
						$(dialogId).ocdialog('close');
					}
				},
				{
					text: t('core', 'Yes'),
					click: function(){
						if (callback !== undefined) {
							callback(true);
						}
						$(dialogId).ocdialog('close');
					},
					defaultButton: true
				}];
				break;
			case OCdialogs.OK_BUTTON:
				var functionToCall = function() {
					$(dialogId).ocdialog('close');
					if(callback !== undefined) {
						callback();
					}
				};
				buttonlist[0] = {
					text: t('core', 'OK'),
					click: functionToCall,
					defaultButton: true
				};
				break;
			}

			$(dialogId).ocdialog({
				closeOnEscape: true,
				modal: modal,
				buttons: buttonlist
			});
			OCdialogs.dialogsCounter++;
		})
		.fail(function(status, error) {
			// If the method is called while navigating away from
			// the page, we still want to deliver the message.
			if(status === 0) {
				alert(title + ': ' + content);
			} else {
				alert(t('core', 'Error loading message template: {error}', {error: error}));
			}
		});
	},
	_fileexistsshown: false,
	/**
	 * Displays file exists dialog
	 * @param {object} data upload object
	 * @param {object} original file with name, size and mtime
	 * @param {object} replacement file with name, size and mtime
	 * @param {object} controller with onCancel, onSkip, onReplace and onRename methods
	 * @return {Promise} jquery promise that resolves after the dialog template was loaded
	*/
	fileexists:function(data, original, replacement, controller) {
		var self = this;
		var dialogDeferred = new $.Deferred();

		var getCroppedPreview = function(file) {
			var deferred = new $.Deferred();
			// Only process image files.
			var type = file.type && file.type.split('/').shift();
			if (window.FileReader && type === 'image') {
				var reader = new FileReader();
				reader.onload = function (e) {
					var blob = new Blob([e.target.result]);
					window.URL = window.URL || window.webkitURL;
					var originalUrl = window.URL.createObjectURL(blob);
					var image = new Image();
					image.src = originalUrl;
					image.onload = function () {
						var url = crop(image);
						deferred.resolve(url);
					};
				};
				reader.readAsArrayBuffer(file);
			} else {
				deferred.reject();
			}
			return deferred;
		};

		var crop = function(img) {
			var canvas = document.createElement('canvas'),
					targetSize = 96,
					width = img.width,
					height = img.height,
					x, y, size;

			// Calculate the width and height, constraining the proportions
			if (width > height) {
				y = 0;
				x = (width - height) / 2;
			} else {
				y = (height - width) / 2;
				x = 0;
			}
			size = Math.min(width, height);

			// Set canvas size to the cropped area
			canvas.width = size;
			canvas.height = size;
			var ctx = canvas.getContext("2d");
			ctx.drawImage(img, x, y, size, size, 0, 0, size, size);

			// Resize the canvas to match the destination (right size uses 96px)
			resampleHermite(canvas, size, size, targetSize, targetSize);

			return canvas.toDataURL("image/png", 0.7);
		};

		/**
		 * Fast image resize/resample using Hermite filter with JavaScript.
		 *
		 * @author: ViliusL
		 *
		 * @param {*} canvas
		 * @param {number} W
		 * @param {number} H
		 * @param {number} W2
		 * @param {number} H2
		 */
		var resampleHermite = function (canvas, W, H, W2, H2) {
			W2 = Math.round(W2);
			H2 = Math.round(H2);
			var img = canvas.getContext("2d").getImageData(0, 0, W, H);
			var img2 = canvas.getContext("2d").getImageData(0, 0, W2, H2);
			var data = img.data;
			var data2 = img2.data;
			var ratio_w = W / W2;
			var ratio_h = H / H2;
			var ratio_w_half = Math.ceil(ratio_w / 2);
			var ratio_h_half = Math.ceil(ratio_h / 2);

			for (var j = 0; j < H2; j++) {
				for (var i = 0; i < W2; i++) {
					var x2 = (i + j * W2) * 4;
					var weight = 0;
					var weights = 0;
					var weights_alpha = 0;
					var gx_r = 0;
					var gx_g = 0;
					var gx_b = 0;
					var gx_a = 0;
					var center_y = (j + 0.5) * ratio_h;
					for (var yy = Math.floor(j * ratio_h); yy < (j + 1) * ratio_h; yy++) {
						var dy = Math.abs(center_y - (yy + 0.5)) / ratio_h_half;
						var center_x = (i + 0.5) * ratio_w;
						var w0 = dy * dy; //pre-calc part of w
						for (var xx = Math.floor(i * ratio_w); xx < (i + 1) * ratio_w; xx++) {
							var dx = Math.abs(center_x - (xx + 0.5)) / ratio_w_half;
							var w = Math.sqrt(w0 + dx * dx);
							if (w >= -1 && w <= 1) {
								//hermite filter
								weight = 2 * w * w * w - 3 * w * w + 1;
								if (weight > 0) {
									dx = 4 * (xx + yy * W);
									//alpha
									gx_a += weight * data[dx + 3];
									weights_alpha += weight;
									//colors
									if (data[dx + 3] < 255)
										weight = weight * data[dx + 3] / 250;
									gx_r += weight * data[dx];
									gx_g += weight * data[dx + 1];
									gx_b += weight * data[dx + 2];
									weights += weight;
								}
							}
						}
					}
					data2[x2] = gx_r / weights;
					data2[x2 + 1] = gx_g / weights;
					data2[x2 + 2] = gx_b / weights;
					data2[x2 + 3] = gx_a / weights_alpha;
				}
			}
			canvas.getContext("2d").clearRect(0, 0, Math.max(W, W2), Math.max(H, H2));
			canvas.width = W2;
			canvas.height = H2;
			canvas.getContext("2d").putImageData(img2, 0, 0);
		};

		var addConflict = function($conflicts, original, replacement) {

			var $conflict = $conflicts.find('.template').clone().removeClass('template').addClass('conflict');
			var $originalDiv = $conflict.find('.original');
			var $replacementDiv = $conflict.find('.replacement');

			$conflict.data('data',data);

			$conflict.find('.filename').text(original.name);
			$originalDiv.find('.size').text(humanFileSize(original.size));
			$originalDiv.find('.mtime').text(formatDate(original.mtime));
			// ie sucks
			if (replacement.size && replacement.lastModifiedDate) {
				$replacementDiv.find('.size').text(humanFileSize(replacement.size));
				$replacementDiv.find('.mtime').text(formatDate(replacement.lastModifiedDate));
			}
			var path = original.directory + '/' +original.name;
			var urlSpec = {
				file:		path,
				x:		96,
				y:		96,
				c:		original.etag,
				forceIcon:	0
			};
			var previewpath = Files.generatePreviewUrl(urlSpec);
			// Escaping single quotes
			previewpath = previewpath.replace(/'/g, "%27");
			$originalDiv.find('.icon').css({"background-image":   "url('" + previewpath + "')"});
			getCroppedPreview(replacement).then(
				function(path){
					$replacementDiv.find('.icon').css('background-image','url(' + path + ')');
				}, function(){
					path = OC.MimeType.getIconUrl(replacement.type);
					$replacementDiv.find('.icon').css('background-image','url(' + path + ')');
				}
			);
			// connect checkboxes with labels
			var checkboxId = $conflicts.find('.conflict').length;
			$originalDiv.find('input:checkbox').attr('id', 'checkbox_original_'+checkboxId);
			$replacementDiv.find('input:checkbox').attr('id', 'checkbox_replacement_'+checkboxId);

			$conflicts.append($conflict);

			//set more recent mtime bold
			// ie sucks
			if (replacement.lastModifiedDate && replacement.lastModifiedDate.getTime() > original.mtime) {
				$replacementDiv.find('.mtime').css('font-weight', 'bold');
			} else if (replacement.lastModifiedDate && replacement.lastModifiedDate.getTime() < original.mtime) {
				$originalDiv.find('.mtime').css('font-weight', 'bold');
			} else {
				//TODO add to same mtime collection?
			}

			// set bigger size bold
			if (replacement.size && replacement.size > original.size) {
				$replacementDiv.find('.size').css('font-weight', 'bold');
			} else if (replacement.size && replacement.size < original.size) {
				$originalDiv.find('.size').css('font-weight', 'bold');
			} else {
				//TODO add to same size collection?
			}

			//TODO show skip action for files with same size and mtime in bottom row

			// always keep readonly files

			if (original.status === 'readonly') {
				$originalDiv
					.addClass('readonly')
					.find('input[type="checkbox"]')
						.prop('checked', true)
						.prop('disabled', true);
				$originalDiv.find('.message')
					.text(t('core','read-only'));
			}
		};
		//var selection = controller.getSelection(data.originalFiles);
		//if (selection.defaultAction) {
		//	controller[selection.defaultAction](data);
		//} else {
		var dialogName = 'oc-dialog-fileexists-content';
		var dialogId = '#' + dialogName;
		if (this._fileexistsshown) {
			// add conflict

			var $conflicts = $(dialogId+ ' .conflicts');
			addConflict($conflicts, original, replacement);

			var count = $(dialogId+ ' .conflict').length;
			var title = n('core',
							'{count} file conflict',
							'{count} file conflicts',
							count,
							{count:count}
						);
			$(dialogId).parent().children('.oc-dialog-title').text(title);

			//recalculate dimensions
			$(window).trigger('resize');
			dialogDeferred.resolve();
		} else {
			//create dialog
			this._fileexistsshown = true;
			$.when(this._getFileExistsTemplate()).then(function($tmpl) {
				var title = t('core','One file conflict');
				var $dlg = $tmpl.octemplate({
					dialog_name: dialogName,
					title: title,
					type: 'fileexists',

					allnewfiles: t('core','New Files'),
					allexistingfiles: t('core','Already existing files'),

					why: t('core','Which files do you want to keep?'),
					what: t('core','If you select both versions, the copied file will have a number added to its name.')
				});
				$('body').append($dlg);

				if (original && replacement) {
					var $conflicts = $dlg.find('.conflicts');
					addConflict($conflicts, original, replacement);
				}

				var buttonlist = [{
						text: t('core', 'Cancel'),
						classes: 'cancel',
						click: function(){
							if ( typeof controller.onCancel !== 'undefined') {
								controller.onCancel(data);
							}
							$(dialogId).ocdialog('close');
						}
					},
					{
						text: t('core', 'Continue'),
						classes: 'continue',
						click: function(){
							if ( typeof controller.onContinue !== 'undefined') {
								controller.onContinue($(dialogId + ' .conflict'));
							}
							$(dialogId).ocdialog('close');
						}
					}];

				$(dialogId).ocdialog({
					width: 500,
					closeOnEscape: true,
					modal: true,
					buttons: buttonlist,
					closeButton: null,
					close: function() {
							self._fileexistsshown = false;
							$(this).ocdialog('destroy').remove();
						}
				});

				$(dialogId).css('height','auto');

				var $primaryButton = $dlg.closest('.oc-dialog').find('button.continue');
				$primaryButton.prop('disabled', true);

				function updatePrimaryButton() {
					var checkedCount = $dlg.find('.conflicts .checkbox:checked').length;
					$primaryButton.prop('disabled', checkedCount === 0);
				}

				//add checkbox toggling actions
				$(dialogId).find('.allnewfiles').on('click', function() {
					var $checkboxes = $(dialogId).find('.conflict .replacement input[type="checkbox"]');
					$checkboxes.prop('checked', $(this).prop('checked'));
				});
				$(dialogId).find('.allexistingfiles').on('click', function() {
					var $checkboxes = $(dialogId).find('.conflict .original:not(.readonly) input[type="checkbox"]');
					$checkboxes.prop('checked', $(this).prop('checked'));
				});
				$(dialogId).find('.conflicts').on('click', '.replacement,.original:not(.readonly)', function() {
					var $checkbox = $(this).find('input[type="checkbox"]');
					$checkbox.prop('checked', !$checkbox.prop('checked'));
				});
				$(dialogId).find('.conflicts').on('click', '.replacement input[type="checkbox"],.original:not(.readonly) input[type="checkbox"]', function() {
					var $checkbox = $(this);
					$checkbox.prop('checked', !$checkbox.prop('checked'));
				});

				//update counters
				$(dialogId).on('click', '.replacement,.allnewfiles', function() {
					var count = $(dialogId).find('.conflict .replacement input[type="checkbox"]:checked').length;
					if (count === $(dialogId+ ' .conflict').length) {
						$(dialogId).find('.allnewfiles').prop('checked', true);
						$(dialogId).find('.allnewfiles + .count').text(t('core','(all selected)'));
					} else if (count > 0) {
						$(dialogId).find('.allnewfiles').prop('checked', false);
						$(dialogId).find('.allnewfiles + .count').text(t('core','({count} selected)',{count:count}));
					} else {
						$(dialogId).find('.allnewfiles').prop('checked', false);
						$(dialogId).find('.allnewfiles + .count').text('');
					}
					updatePrimaryButton();
				});
				$(dialogId).on('click', '.original,.allexistingfiles', function(){
					var count = $(dialogId).find('.conflict .original input[type="checkbox"]:checked').length;
					if (count === $(dialogId+ ' .conflict').length) {
						$(dialogId).find('.allexistingfiles').prop('checked', true);
						$(dialogId).find('.allexistingfiles + .count').text(t('core','(all selected)'));
					} else if (count > 0) {
						$(dialogId).find('.allexistingfiles').prop('checked', false);
						$(dialogId).find('.allexistingfiles + .count')
							.text(t('core','({count} selected)',{count:count}));
					} else {
						$(dialogId).find('.allexistingfiles').prop('checked', false);
						$(dialogId).find('.allexistingfiles + .count').text('');
					}
					updatePrimaryButton();
				});

				dialogDeferred.resolve();
			})
			.fail(function() {
				dialogDeferred.reject();
				alert(t('core', 'Error loading file exists template'));
			});
		}
		//}
		return dialogDeferred.promise();
	},
	// get the gridview setting and set the input accordingly
	_getGridSettings: function() {
		var self = this;
		$.get(OC.generateUrl('/apps/files/api/v1/showgridview'), function(response) {
			self.$showGridView.get(0).checked = response.gridview;
			self.$showGridView.next('#picker-view-toggle')
				.removeClass('icon-toggle-filelist icon-toggle-pictures')
				.addClass(response.gridview ? 'icon-toggle-filelist' : 'icon-toggle-pictures')
			$('.list-container').toggleClass('view-grid', response.gridview);
		});
	},
	_onGridviewChange: function() {
		var show = this.$showGridView.is(':checked');
		// only save state if user is logged in
		if (OC.currentUser) {
			$.post(OC.generateUrl('/apps/files/api/v1/showgridview'), {
				show: show
			});
		}
		this.$showGridView.next('#picker-view-toggle')
			.removeClass('icon-toggle-filelist icon-toggle-pictures')
			.addClass(show ? 'icon-toggle-filelist' : 'icon-toggle-pictures')
		$('.list-container').toggleClass('view-grid', show);
	},
	_getFilePickerTemplate: function() {
		var defer = $.Deferred();
		if(!this.$filePickerTemplate) {
			var self = this;
			$.get(OC.filePath('core', 'templates', 'filepicker.html'), function(tmpl) {
				self.$filePickerTemplate = $(tmpl);
				self.$listTmpl = self.$filePickerTemplate.find('.filelist tbody tr:first-child').detach();
				defer.resolve(self.$filePickerTemplate);
			})
			.fail(function(jqXHR, textStatus, errorThrown) {
				defer.reject(jqXHR.status, errorThrown);
			});
		} else {
			defer.resolve(this.$filePickerTemplate);
		}
		return defer.promise();
	},
	_getMessageTemplate: function() {
		var defer = $.Deferred();
		if(!this.$messageTemplate) {
			var self = this;
			$.get(OC.filePath('core', 'templates', 'message.html'), function(tmpl) {
				self.$messageTemplate = $(tmpl);
				defer.resolve(self.$messageTemplate);
			})
			.fail(function(jqXHR, textStatus, errorThrown) {
				defer.reject(jqXHR.status, errorThrown);
			});
		} else {
			defer.resolve(this.$messageTemplate);
		}
		return defer.promise();
	},
	_getFileExistsTemplate: function () {
		var defer = $.Deferred();
		if (!this.$fileexistsTemplate) {
			var self = this;
			$.get(OC.filePath('files', 'templates', 'fileexists.html'), function (tmpl) {
				self.$fileexistsTemplate = $(tmpl);
				defer.resolve(self.$fileexistsTemplate);
			})
			.fail(function () {
				defer.reject();
			});
		} else {
			defer.resolve(this.$fileexistsTemplate);
		}
		return defer.promise();
	},
	_getFileList: function(dir, mimeType) { //this is only used by the spreedme app atm
		if (typeof(mimeType) === "string") {
			mimeType = [mimeType];
		}

		return $.getJSON(
			OC.filePath('files', 'ajax', 'list.php'),
			{
				dir: dir,
				mimetypes: JSON.stringify(mimeType)
			}
		);
	},

	/**
	 * fills the filepicker with files
	*/
	_fillFilePicker:function(dir) {
		var self = this;
		this.$filelist.empty();
		this.$filePicker.find('.emptycontent').hide();
		this.$filelistContainer.addClass('icon-loading');
		this.$filePicker.data('path', dir);
		var filter = this.$filePicker.data('mimetype');
		if (typeof(filter) === "string") {
			filter = [filter];
		}
		self.$fileListHeader.find('.sort-indicator').addClass('hidden').removeClass('icon-triangle-n').removeClass('icon-triangle-s');
		self.$fileListHeader.find('[data-sort=' + self.filepicker.sortField + '] .sort-indicator').removeClass('hidden');
		if (self.filepicker.sortOrder === 'asc') {
			self.$fileListHeader.find('[data-sort=' + self.filepicker.sortField + '] .sort-indicator').addClass('icon-triangle-n');
		} else {
			self.$fileListHeader.find('[data-sort=' + self.filepicker.sortField + '] .sort-indicator').addClass('icon-triangle-s');
		}
		self.filepicker.filesClient.getFolderContents(dir).then(function(status, files) {
			self.filelist = files;
			if (filter && filter.length > 0 && filter.indexOf('*') === -1) {
				files = files.filter(function (file) {
					return file.type === 'dir' || filter.indexOf(file.mimetype) !== -1;
				});
			}

			var Comparators = {
				name: function(fileInfo1, fileInfo2) {
					if (fileInfo1.type === 'dir' && fileInfo2.type !== 'dir') {
						return -1;
					}
					if (fileInfo1.type !== 'dir' && fileInfo2.type === 'dir') {
						return 1;
					}
					return OC.Util.naturalSortCompare(fileInfo1.name, fileInfo2.name);
				},
				size: function(fileInfo1, fileInfo2) {
					return fileInfo1.size - fileInfo2.size;
				},
				mtime: function(fileInfo1, fileInfo2) {
					return fileInfo1.mtime - fileInfo2.mtime;
				}
			};
			var comparator = Comparators[self.filepicker.sortField] || Comparators.name;
			files = files.sort(function(file1, file2) {
				var isFavorite = function(fileInfo) {
					return fileInfo.tags && fileInfo.tags.indexOf(OC.TAG_FAVORITE) >= 0;
				};

				if (isFavorite(file1) && !isFavorite(file2)) {
					return -1;
				} else if (!isFavorite(file1) && isFavorite(file2)) {
					return 1;
				}

				return self.filepicker.sortOrder === 'asc' ? comparator(file1, file2) : -comparator(file1, file2);
			});

			self._fillSlug();

			if (files.length === 0) {
				self.$filePicker.find('.emptycontent').show();
				self.$fileListHeader.hide();
			} else {
				self.$filePicker.find('.emptycontent').hide();
				self.$fileListHeader.show();
			}

			$.each(files, function(idx, entry) {
				entry.icon = OC.MimeType.getIconUrl(entry.mimetype);
				var simpleSize, sizeColor;
				if (typeof(entry.size) !== 'undefined' && entry.size >= 0) {
					simpleSize = humanFileSize(parseInt(entry.size, 10), true);
					sizeColor = Math.round(160 - Math.pow((entry.size / (1024 * 1024)), 2));
				} else {
					simpleSize = t('files', 'Pending');
					sizeColor = 80;
				}

				// split the filename in half if the size is bigger than 20 char
				// for ellipsis
				if (entry.name.length >= 10) {
					// leave maximum 10 letters
					var split = Math.min(Math.floor(entry.name.length / 2), 10)
					var filename1 = entry.name.substr(0, entry.name.length - split)
					var filename2 = entry.name.substr(entry.name.length - split)
				} else {
					var filename1 = entry.name
					var filename2 = ''
				}

				var $row = self.$listTmpl.octemplate({
					type: entry.type,
					dir: dir,
					filename: entry.name,
					filename1: filename1,
					filename2: filename2,
					date: OC.Util.relativeModifiedDate(entry.mtime),
					size: simpleSize,
					sizeColor: sizeColor,
					icon: entry.icon
				});
				if (entry.type === 'file') {
					var urlSpec = {
						file: dir + '/' + entry.name,
						x: 100,
						y: 100
					};
					var img = new Image();
					var previewUrl = OC.generateUrl('/core/preview.png?') + $.param(urlSpec);
					img.onload = function() {
						if (img.width > 5) {
							$row.find('td.filename').attr('style', 'background-image:url(' + previewUrl + ')');
						}
					};
					img.src = previewUrl;
				}
				self.$filelist.append($row);
			});

			self.$filelistContainer.removeClass('icon-loading');
		});
	},
	/**
	 * fills the tree list with directories
	*/
	_fillSlug: function() {
		this.$dirTree.empty();
		var self = this;
		var dir;
		var path = this.$filePicker.data('path');
		var $template = $('<div data-dir="{dir}"><a>{name}</a></div>').addClass('crumb');
		if(path) {
			var paths = path.split('/');
			$.each(paths, function(index, dir) {
				dir = paths.pop();
				if(dir === '') {
					return false;
				}
				self.$dirTree.prepend($template.octemplate({
					dir: paths.join('/') + '/' + dir,
					name: dir
				}));
			});
		}
		$template.octemplate({
			dir: '',
			name: '' // Ugly but works ;)
		}, {escapeFunction: null}).prependTo(this.$dirTree);
	},
	/**
	 * handle selection made in the tree list
	*/
	_handleTreeListSelect:function(event, type) {
		var self = event.data;
		var dir = $(event.target).closest('.crumb').data('dir');
		self._fillFilePicker(dir);
		var getOcDialog = (event.target).closest('.oc-dialog');
		var buttonEnableDisable = $('.primary', getOcDialog);
		this._changeButtonsText(type, dir.split(/[/]+/).pop());
		if (this.$filePicker.data('mimetype').indexOf("httpd/unix-directory") !== -1) {
			buttonEnableDisable.prop("disabled", false);
		} else {
			buttonEnableDisable.prop("disabled", true);
		}
	},
	/**
	 * handle clicks made in the filepicker
	*/
	_handlePickerClick:function(event, $element, type) {
		var getOcDialog = this.$filePicker.closest('.oc-dialog');
		var buttonEnableDisable = getOcDialog.find('.primary');
		if ($element.data('type') === 'file') {
			if (this.$filePicker.data('multiselect') !== true || !event.ctrlKey) {
				this.$filelist.find('.filepicker_element_selected').removeClass('filepicker_element_selected');
			}
			$element.toggleClass('filepicker_element_selected');
			buttonEnableDisable.prop("disabled", false);
		} else if ( $element.data('type') === 'dir' ) {
			this._fillFilePicker(this.$filePicker.data('path') + '/' + $element.data('entryname'));
			this._changeButtonsText(type, $element.data('entryname'));
			if (this.$filePicker.data('mimetype').indexOf("httpd/unix-directory") !== -1) {
				buttonEnableDisable.prop("disabled", false);
			} else {
				buttonEnableDisable.prop("disabled", true);
			}
		}
	},

	/**
	 * Handle
	 * @param type of action
	 * @param dir on which to change buttons text
	 * @private
	 */
	_changeButtonsText: function(type, dir) {
		var copyText = dir === '' ? t('core', 'Copy') : t('core', 'Copy to {folder}', {folder: dir});
		var moveText = dir === '' ? t('core', 'Move') : t('core', 'Move to {folder}', {folder: dir});
		var buttons = $('.oc-dialog-buttonrow button');
		switch (type) {
			case this.FILEPICKER_TYPE_CHOOSE:
				break;
			case this.FILEPICKER_TYPE_COPY:
				buttons.text(copyText);
				break;
			case this.FILEPICKER_TYPE_MOVE:
				buttons.text(moveText);
				break;
			case this.FILEPICKER_TYPE_COPY_MOVE:
				buttons.eq(0).text(copyText);
				buttons.eq(1).text(moveText);
				break;
		}
	}
};


/* global oc_isadmin */

var oc_debug;
var oc_webroot;

var oc_current_user = document.getElementsByTagName('head')[0].getAttribute('data-user');
var oc_requesttoken = document.getElementsByTagName('head')[0].getAttribute('data-requesttoken');

window.oc_config = window.oc_config || {};

if (typeof oc_webroot === "undefined") {
	oc_webroot = location.pathname;
	var pos = oc_webroot.indexOf('/index.php/');
	if (pos !== -1) {
		oc_webroot = oc_webroot.substr(0, pos);
	}
	else {
		oc_webroot = oc_webroot.substr(0, oc_webroot.lastIndexOf('/'));
	}
}

/** @namespace OCP */
var OCP = Object.assign({}, window.OCP);

/**
 * @namespace OC
 */
Object.assign(window.OC, {
	PERMISSION_NONE:0,
	PERMISSION_CREATE:4,
	PERMISSION_READ:1,
	PERMISSION_UPDATE:2,
	PERMISSION_DELETE:8,
	PERMISSION_SHARE:16,
	PERMISSION_ALL:31,
	TAG_FAVORITE: '_$!<Favorite>!$_',
	/* jshint camelcase: false */
	/**
	 * Relative path to Nextcloud root.
	 * For example: "/nextcloud"
	 *
	 * @type string
	 *
	 * @deprecated since 8.2, use OC.getRootPath() instead
	 * @see OC#getRootPath
	 */
	webroot:oc_webroot,

	/**
	 * Capabilities
	 *
	 * @type array
	 */
	_capabilities: window.oc_capabilities || null,

	appswebroots:(typeof oc_appswebroots !== 'undefined') ? oc_appswebroots:false,
	/**
	 * Currently logged in user or null if none
	 *
	 * @type String
	 * @deprecated use {@link OC.getCurrentUser} instead
	 */
	currentUser:(typeof oc_current_user!=='undefined')?oc_current_user:false,
	config: window.oc_config,
	appConfig: window.oc_appconfig || {},
	theme: window.oc_defaults || {},
	coreApps:['', 'admin','log','core/search','settings','core','3rdparty'],
	requestToken: oc_requesttoken,
	menuSpeed: 50,

	/**
	 * Get an absolute url to a file in an app
	 * @param {string} app the id of the app the file belongs to
	 * @param {string} file the file path relative to the app folder
	 * @return {string} Absolute URL to a file
	 */
	linkTo:function(app,file){
		return OC.filePath(app,'',file);
	},

	/**
	 * Creates a relative url for remote use
	 * @param {string} service id
	 * @return {string} the url
	 */
	linkToRemoteBase:function(service) {
		return OC.getRootPath() + '/remote.php/' + service;
	},

	/**
	 * @brief Creates an absolute url for remote use
	 * @param {string} service id
	 * @return {string} the url
	 */
	linkToRemote:function(service) {
		return window.location.protocol + '//' + window.location.host + OC.linkToRemoteBase(service);
	},

	/**
	 * Gets the base path for the given OCS API service.
	 * @param {string} service name
	 * @param {int} version OCS API version
	 * @return {string} OCS API base path
	 */
	linkToOCS: function(service, version) {
		version = (version !== 2) ? 1 : 2;
		return window.location.protocol + '//' + window.location.host + OC.getRootPath() + '/ocs/v' + version + '.php/' + service + '/';
	},

	/**
	 * Generates the absolute url for the given relative url, which can contain parameters.
	 * Parameters will be URL encoded automatically.
	 * @param {string} url
	 * @param [params] params
	 * @param [options] options
	 * @param {bool} [options.escape=true] enable/disable auto escape of placeholders (by default enabled)
	 * @return {string} Absolute URL for the given relative URL
	 */
	generateUrl: function(url, params, options) {
		var defaultOptions = {
				escape: true
			},
			allOptions = options || {};
		_.defaults(allOptions, defaultOptions);

		var _build = function (text, vars) {
			vars = vars || [];
			return text.replace(/{([^{}]*)}/g,
				function (a, b) {
					var r = (vars[b]);
					if(allOptions.escape) {
						return (typeof r === 'string' || typeof r === 'number') ? encodeURIComponent(r) : encodeURIComponent(a);
					} else {
						return (typeof r === 'string' || typeof r === 'number') ? r : a;
					}
				}
			);
		};
		if (url.charAt(0) !== '/') {
			url = '/' + url;

		}

		if(oc_config.modRewriteWorking == true) {
			return OC.getRootPath() + _build(url, params);
		}

		return OC.getRootPath() + '/index.php' + _build(url, params);
	},

	/**
	 * Get the absolute url for a file in an app
	 * @param {string} app the id of the app
	 * @param {string} type the type of the file to link to (e.g. css,img,ajax.template)
	 * @param {string} file the filename
	 * @return {string} Absolute URL for a file in an app
	 */
	filePath:function(app,type,file){
		var isCore=OC.coreApps.indexOf(app)!==-1,
			link=OC.getRootPath();
		if(file.substring(file.length-3) === 'php' && !isCore){
			link+='/index.php/apps/' + app;
			if (file != 'index.php') {
				link+='/';
				if(type){
					link+=encodeURI(type + '/');
				}
				link+= file;
			}
		}else if(file.substring(file.length-3) !== 'php' && !isCore){
			link=OC.appswebroots[app];
			if(type){
				link+= '/'+type+'/';
			}
			if(link.substring(link.length-1) !== '/'){
				link+='/';
			}
			link+=file;
		}else{
			if ((app == 'settings' || app == 'core' || app == 'search') && type == 'ajax') {
				link+='/index.php/';
			}
			else {
				link+='/';
			}
			if(!isCore){
				link+='apps/';
			}
			if (app !== '') {
				app+='/';
				link+=app;
			}
			if(type){
				link+=type+'/';
			}
			link+=file;
		}
		return link;
	},

	/**
	 * Check if a user file is allowed to be handled.
	 * @param {string} file to check
	 */
	fileIsBlacklisted: function(file) {
		return !!(file.match(oc_config.blacklist_files_regex));
	},

	/**
	 * Redirect to the target URL, can also be used for downloads.
	 * @param {string} targetURL URL to redirect to
	 */
	redirect: function(targetURL) {
		window.location = targetURL;
	},

	/**
	 * Reloads the current page
	 */
	reload: function() {
		window.location.reload();
	},

	/**
	 * Protocol that is used to access this Nextcloud instance
	 * @return {string} Used protocol
	 */
	getProtocol: function() {
		return window.location.protocol.split(':')[0];
	},

	/**
	 * Returns the host used to access this Nextcloud instance
	 * Host is sometimes the same as the hostname but now always.
	 *
	 * Examples:
	 * http://example.com => example.com
	 * https://example.com => example.com
	 * http://example.com:8080 => example.com:8080
	 *
	 * @return {string} host
	 *
	 * @since 8.2
	 */
	getHost: function() {
		return window.location.host;
	},

	/**
	 * Returns the hostname used to access this Nextcloud instance
	 * The hostname is always stripped of the port
	 *
	 * @return {string} hostname
	 * @since 9.0
	 */
	getHostName: function() {
		return window.location.hostname;
	},

	/**
	 * Returns the port number used to access this Nextcloud instance
	 *
	 * @return {int} port number
	 *
	 * @since 8.2
	 */
	getPort: function() {
		return window.location.port;
	},

	/**
	 * Returns the web root path where this Nextcloud instance
	 * is accessible, with a leading slash.
	 * For example "/nextcloud".
	 *
	 * @return {string} web root path
	 *
	 * @since 8.2
	 */
	getRootPath: function() {
		return OC.webroot;
	},


	/**
	 * Returns the capabilities
	 *
	 * @return {array} capabilities
	 *
	 * @since 14.0
	 */
	getCapabilities: function() {
		return OC._capabilities;
	},

	/**
	 * Returns the currently logged in user or null if there is no logged in
	 * user (public page mode)
	 *
	 * @return {OC.CurrentUser} user spec
	 * @since 9.0.0
	 */
	getCurrentUser: function() {
		if (_.isUndefined(this._currentUserDisplayName)) {
			this._currentUserDisplayName = document.getElementsByTagName('head')[0].getAttribute('data-user-displayname');
		}
		return {
			uid: this.currentUser,
			displayName: this._currentUserDisplayName
		};
	},

	/**
	 * get the absolute path to an image file
	 * if no extension is given for the image, it will automatically decide
	 * between .png and .svg based on what the browser supports
	 * @param {string} app the app id to which the image belongs
	 * @param {string} file the name of the image file
	 * @return {string}
	 */
	imagePath:function(app,file){
		if(file.indexOf('.')==-1){//if no extension is given, use svg
			file+='.svg';
		}
		return OC.filePath(app,'img',file);
	},

	/**
	 * URI-Encodes a file path but keep the path slashes.
	 *
	 * @param path path
	 * @return encoded path
	 */
	encodePath: function(path) {
		if (!path) {
			return path;
		}
		var parts = path.split('/');
		var result = [];
		for (var i = 0; i < parts.length; i++) {
			result.push(encodeURIComponent(parts[i]));
		}
		return result.join('/');
	},

	/**
	 * Load a script for the server and load it. If the script is already loaded,
	 * the event handler will be called directly
	 * @param {string} app the app id to which the script belongs
	 * @param {string} script the filename of the script
	 * @param ready event handler to be called when the script is loaded
	 * @deprecated 16.0.0 Use OCP.Loader.loadScript
	 */
	addScript:function(app,script,ready){
		var deferred, path=OC.filePath(app,'js',script+'.js');
		if(!OC.addScript.loaded[path]) {
			deferred = $.Deferred();
			$.getScript(path, function() {
				deferred.resolve();
			});
			OC.addScript.loaded[path] = deferred;
		} else {
			if (ready) {
				ready();
			}
		}
		return OC.addScript.loaded[path];
	},
	/**
	 * Loads a CSS file
	 * @param {string} app the app id to which the css style belongs
	 * @param {string} style the filename of the css file
	 * @deprecated 16.0.0 Use OCP.Loader.loadStylesheet
	 */
	addStyle:function(app,style){
		var path=OC.filePath(app,'css',style+'.css');
		if(OC.addStyle.loaded.indexOf(path)===-1){
			OC.addStyle.loaded.push(path);
			if (document.createStyleSheet) {
				document.createStyleSheet(path);
			} else {
				style=$('<link rel="stylesheet" type="text/css" href="'+path+'"/>');
				$('head').append(style);
			}
		}
	},

	/**
	 * Loads translations for the given app asynchronously.
	 *
	 * @param {String} app app name
	 * @param {Function} callback callback to call after loading
	 * @return {Promise}
	 */
	addTranslations: function(app, callback) {
		return OC.L10N.load(app, callback);
	},

	/**
	 * Returns the base name of the given path.
	 * For example for "/abc/somefile.txt" it will return "somefile.txt"
	 *
	 * @param {String} path
	 * @return {String} base name
	 */
	basename: function(path) {
		return path.replace(/\\/g,'/').replace( /.*\//, '' );
	},

	/**
	 * Returns the dir name of the given path.
	 * For example for "/abc/somefile.txt" it will return "/abc"
	 *
	 * @param {String} path
	 * @return {String} dir name
	 */
	dirname: function(path) {
		return path.replace(/\\/g,'/').replace(/\/[^\/]*$/, '');
	},

	/**
	 * Returns whether the given paths are the same, without
	 * leading, trailing or doubled slashes and also removing
	 * the dot sections.
	 *
	 * @param {String} path1 first path
	 * @param {String} path2 second path
	 * @return {bool} true if the paths are the same
	 *
	 * @since 9.0
	 */
	isSamePath: function(path1, path2) {
		var filterDot = function(p) {
			return p !== '.';
		};
		var pathSections1 = _.filter((path1 || '').split('/'), filterDot);
		var pathSections2 = _.filter((path2 || '').split('/'), filterDot);
		path1 = OC.joinPaths.apply(OC, pathSections1);
		path2 = OC.joinPaths.apply(OC, pathSections2);
		return path1 === path2;
	},

	/**
	 * Join path sections
	 *
	 * @param {...String} path sections
	 *
	 * @return {String} joined path, any leading or trailing slash
	 * will be kept
	 *
	 * @since 8.2
	 */
	joinPaths: function() {
		if (arguments.length < 1) {
			return '';
		}
		var path = '';
		// convert to array
		var args = Array.prototype.slice.call(arguments);
		// discard empty arguments
		args = _.filter(args, function(arg) {
			return arg.length > 0;
		});
		if (args.length < 1) {
			return '';
		}

		var lastArg = args[args.length - 1];
		var leadingSlash = args[0].charAt(0) === '/';
		var trailingSlash = lastArg.charAt(lastArg.length - 1) === '/';
		var sections = [];
		var i;
		for (i = 0; i < args.length; i++) {
			sections = sections.concat(args[i].split('/'));
		}
		var first = !leadingSlash;
		for (i = 0; i < sections.length; i++) {
			if (sections[i] !== '') {
				if (first) {
					first = false;
				} else {
					path += '/';
				}
				path += sections[i];
			}
		}

		if (trailingSlash) {
			// add it back
			path += '/';
		}
		return path;
	},

	/**
	 * Dialog helper for jquery dialogs.
	 *
	 * @namespace OC.dialogs
	 */
	dialogs:OCdialogs,
	/**
	 * Parses a URL query string into a JS map
	 * @param {string} queryString query string in the format param1=1234&param2=abcde&param3=xyz
	 * @return {Object.<string, string>} map containing key/values matching the URL parameters
	 */
	parseQueryString:function(queryString){
		var parts,
			pos,
			components,
			result = {},
			key,
			value;
		if (!queryString){
			return null;
		}
		pos = queryString.indexOf('?');
		if (pos >= 0){
			queryString = queryString.substr(pos + 1);
		}
		parts = queryString.replace(/\+/g, '%20').split('&');
		for (var i = 0; i < parts.length; i++){
			// split on first equal sign
			var part = parts[i];
			pos = part.indexOf('=');
			if (pos >= 0) {
				components = [
					part.substr(0, pos),
					part.substr(pos + 1)
				];
			}
			else {
				// key only
				components = [part];
			}
			if (!components.length){
				continue;
			}
			key = decodeURIComponent(components[0]);
			if (!key){
				continue;
			}
			// if equal sign was there, return string
			if (components.length > 1) {
				result[key] = decodeURIComponent(components[1]);
			}
			// no equal sign => null value
			else {
				result[key] = null;
			}
		}
		return result;
	},

	/**
	 * Builds a URL query from a JS map.
	 * @param {Object.<string, string>} params map containing key/values matching the URL parameters
	 * @return {string} String containing a URL query (without question) mark
	 */
	buildQueryString: function(params) {
		if (!params) {
			return '';
		}
		return $.map(params, function(value, key) {
			var s = encodeURIComponent(key);
			if (value !== null && typeof(value) !== 'undefined') {
				s += '=' + encodeURIComponent(value);
			}
			return s;
		}).join('&');
	},

	/**
	 * Opens a popup with the setting for an app.
	 * @param {string} appid The ID of the app e.g. 'calendar', 'contacts' or 'files'.
	 * @param {boolean|string} loadJS If true 'js/settings.js' is loaded. If it's a string
	 * it will attempt to load a script by that name in the 'js' directory.
	 * @param {boolean} [cache] If true the javascript file won't be forced refreshed. Defaults to true.
	 * @param {string} [scriptName] The name of the PHP file to load. Defaults to 'settings.php' in
	 * the root of the app directory hierarchy.
	 */
	appSettings:function(args) {
		if(typeof args === 'undefined' || typeof args.appid === 'undefined') {
			throw { name: 'MissingParameter', message: 'The parameter appid is missing' };
		}
		var props = {scriptName:'settings.php', cache:true};
		$.extend(props, args);
		var settings = $('#appsettings');
		if(settings.length === 0) {
			throw { name: 'MissingDOMElement', message: 'There has be be an element with id "appsettings" for the popup to show.' };
		}
		var popup = $('#appsettings_popup');
		if(popup.length === 0) {
			$('body').prepend('<div class="popup hidden" id="appsettings_popup"></div>');
			popup = $('#appsettings_popup');
			popup.addClass(settings.hasClass('topright') ? 'topright' : 'bottomleft');
		}
		if(popup.is(':visible')) {
			popup.hide().remove();
		} else {
			var arrowclass = settings.hasClass('topright') ? 'up' : 'left';
			var jqxhr = $.get(OC.filePath(props.appid, '', props.scriptName), function(data) {
				popup.html(data).ready(function() {
					popup.prepend('<span class="arrow '+arrowclass+'"></span><h2>'+t('core', 'Settings')+'</h2><a class="close"></a>').show();
					popup.find('.close').bind('click', function() {
						popup.remove();
					});
					if(typeof props.loadJS !== 'undefined') {
						var scriptname;
						if(props.loadJS === true) {
							scriptname = 'settings.js';
						} else if(typeof props.loadJS === 'string') {
							scriptname = props.loadJS;
						} else {
							throw { name: 'InvalidParameter', message: 'The "loadJS" parameter must be either boolean or a string.' };
						}
						if(props.cache) {
							$.ajaxSetup({cache: true});
						}
						$.getScript(OC.filePath(props.appid, 'js', scriptname))
						.fail(function(jqxhr, settings, e) {
							throw e;
						});
					}
				}).show();
			}, 'html');
		}
	},

	/**
	 * For menu toggling
	 * @todo Write documentation
	 *
	 * @param {jQuery} $toggle
	 * @param {jQuery} $menuEl
	 * @param {function|undefined} toggle callback invoked everytime the menu is opened
	 * @param {boolean} headerMenu is this a top right header menu?
	 * @returns {undefined}
	 */
	registerMenu: function($toggle, $menuEl, toggle, headerMenu) {
		var self = this;
		$menuEl.addClass('menu');

		// On link, the enter key trigger a click event
		// Only use the click to avoid two fired events
		$toggle.on($toggle.prop('tagName') === 'A'
			? 'click.menu'
			: 'click.menu keyup.menu', function(event) {
			// prevent the link event (append anchor to URL)
			event.preventDefault();

			// allow enter key as a trigger
			if (event.key && event.key !== "Enter") {
				return;
			}

			if ($menuEl.is(OC._currentMenu)) {
				self.hideMenus();
				return;
			}
			// another menu was open?
			else if (OC._currentMenu) {
				// close it
				self.hideMenus();
			}

			if (headerMenu === true) {
				$menuEl.parent().addClass('openedMenu');
			}

			// Set menu to expanded
			$toggle.attr('aria-expanded', true);

			$menuEl.slideToggle(OC.menuSpeed, toggle);
			OC._currentMenu = $menuEl;
			OC._currentMenuToggle = $toggle;
		});
	},

	/**
	 *  @todo Write documentation
	 */
	unregisterMenu: function($toggle, $menuEl) {
		// close menu if opened
		if ($menuEl.is(OC._currentMenu)) {
			this.hideMenus();
		}
		$toggle.off('click.menu').removeClass('menutoggle');
		$menuEl.removeClass('menu');
	},

	/**
	 * Hides any open menus
	 *
	 * @param {Function} complete callback when the hiding animation is done
	 */
	hideMenus: function(complete) {
		if (OC._currentMenu) {
			var lastMenu = OC._currentMenu;
			OC._currentMenu.trigger(new $.Event('beforeHide'));
			OC._currentMenu.slideUp(OC.menuSpeed, function() {
				lastMenu.trigger(new $.Event('afterHide'));
				if (complete) {
					complete.apply(this, arguments);
				}
			});
		}

		// Set menu to closed
		$('.menutoggle').attr('aria-expanded', false);

		$('.openedMenu').removeClass('openedMenu');
		OC._currentMenu = null;
		OC._currentMenuToggle = null;
	},

	/**
	 * Shows a given element as menu
	 *
	 * @param {Object} [$toggle=null] menu toggle
	 * @param {Object} $menuEl menu element
	 * @param {Function} complete callback when the showing animation is done
	 */
	showMenu: function($toggle, $menuEl, complete) {
		if ($menuEl.is(OC._currentMenu)) {
			return;
		}
		this.hideMenus();
		OC._currentMenu = $menuEl;
		OC._currentMenuToggle = $toggle;
		$menuEl.trigger(new $.Event('beforeShow'));
		$menuEl.show();
		$menuEl.trigger(new $.Event('afterShow'));
		// no animation
		if (_.isFunction(complete)) {
			complete();
		}
	},

	/**
	 * Returns the user's locale as a BCP 47 compliant language tag
	 *
	 * @return {String} locale string
	 */
	getCanonicalLocale: function() {
		var locale = this.getLocale();
		return typeof locale === 'string' ? locale.replace(/_/g, '-') : locale;
	},

	/**
	 * Returns the user's locale
	 *
	 * @return {String} locale string
	 */
	getLocale: function() {
		return $('html').data('locale');
	},

	/**
	 * Returns the user's language
	 *
	 * @returns {String} language string
	 */
	getLanguage: function () {
		return $('html').prop('lang');
	},

	/**
	 * Returns whether the current user is an administrator
	 *
	 * @return {bool} true if the user is an admin, false otherwise
	 * @since 9.0.0
	 */
	isUserAdmin: function() {
		return oc_isadmin;
	},

	/**
	 * Warn users that the connection to the server was lost temporarily
	 *
	 * This function is throttled to prevent stacked notfications.
	 * After 7sec the first notification is gone, then we can show another one
	 * if necessary.
	 */
	_ajaxConnectionLostHandler: _.throttle(function() {
		OC.Notification.showTemporary(t('core', 'Connection to server lost'));
	}, 7 * 1000, {trailing: false}),

	/**
	 * Process ajax error, redirects to main page
	 * if an error/auth error status was returned.
	 */
	_processAjaxError: function(xhr) {
		var self = this;
		// purposefully aborted request ?
		// this._userIsNavigatingAway needed to distinguish ajax calls cancelled by navigating away
		// from calls cancelled by failed cross-domain ajax due to SSO redirect
		if (xhr.status === 0 && (xhr.statusText === 'abort' || xhr.statusText === 'timeout' || self._reloadCalled)) {
			return;
		}

		if (_.contains([302, 303, 307, 401], xhr.status) && OC.currentUser) {
			// sometimes "beforeunload" happens later, so need to defer the reload a bit
			setTimeout(function() {
				if (!self._userIsNavigatingAway && !self._reloadCalled) {
					var timer = 0;
					var seconds = 5;
					var interval = setInterval( function() {
						OC.Notification.showUpdate(n('core', 'Problem loading page, reloading in %n second', 'Problem loading page, reloading in %n seconds', seconds - timer));
						if (timer >= seconds) {
							clearInterval(interval);
							OC.reload();
						}
						timer++;
						}, 1000 // 1 second interval
					);

					// only call reload once
					self._reloadCalled = true;
				}
			}, 100);
		} else if(xhr.status === 0) {
			// Connection lost (e.g. WiFi disconnected or server is down)
			setTimeout(function() {
				if (!self._userIsNavigatingAway && !self._reloadCalled) {
					self._ajaxConnectionLostHandler();
				}
			}, 100);
		}
	},

	/**
	 * Registers XmlHttpRequest object for global error processing.
	 *
	 * This means that if this XHR object returns 401 or session timeout errors,
	 * the current page will automatically be reloaded.
	 *
	 * @param {XMLHttpRequest} xhr
	 */
	registerXHRForErrorProcessing: function(xhr) {
		var loadCallback = function() {
			if (xhr.readyState !== 4) {
				return;
			}

			if (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304) {
				return;
			}

			// fire jquery global ajax error handler
			$(document).trigger(new $.Event('ajaxError'), xhr);
		};

		var errorCallback = function() {
			// fire jquery global ajax error handler
			$(document).trigger(new $.Event('ajaxError'), xhr);
		};

		if (xhr.addEventListener) {
			xhr.addEventListener('load', loadCallback);
			xhr.addEventListener('error', errorCallback);
		}

	}
});

OC.addStyle.loaded=[];
OC.addScript.loaded=[];

/**
 * Initializes core
 */
function initCore() {
	/**
	 * Disable automatic evaluation of responses for $.ajax() functions (and its
	 * higher-level alternatives like $.get() and $.post()).
	 *
	 * If a response to a $.ajax() request returns a content type of "application/javascript"
	 * JQuery would previously execute the response body. This is a pretty unexpected
	 * behaviour and can result in a bypass of our Content-Security-Policy as well as
	 * multiple unexpected XSS vectors.
	 */
	$.ajaxSetup({
		contents: {
			script: false
		}
	});

	/**
	 * Disable execution of eval in jQuery. We do require an allowed eval CSP
	 * configuration at the moment for handlebars et al. But for jQuery there is
	 * not much of a reason to execute JavaScript directly via eval.
	 *
	 * This thus mitigates some unexpected XSS vectors.
	 */
	jQuery.globalEval = function(){};

	/**
	 * Set users locale to moment.js as soon as possible
	 */
	moment.locale(OC.getLocale());

	var userAgent = window.navigator.userAgent;
	var msie = userAgent.indexOf('MSIE ');
	var trident = userAgent.indexOf('Trident/');
	var edge = userAgent.indexOf('Edge/');

	if (msie > 0 || trident > 0) {
		// (IE 10 or older) || IE 11
		$('html').addClass('ie');
	} else if (edge > 0) {
		// for edge
		$('html').addClass('edge');
	}

	// css variables fallback for IE
	if (msie > 0 || trident > 0 || edge > 0) {
		console.info('Legacy browser detected, applying css vars polyfill')
		cssVars({
			watch: true,
			//  set edge < 16 as incompatible
			onlyLegacy: !(/Edge\/([0-9]{2})\./i.test(navigator.userAgent)
				&& parseInt(/Edge\/([0-9]{2})\./i.exec(navigator.userAgent)[1]) < 16)
		});
	}

	$(window).on('unload.main', function() {
		OC._unloadCalled = true;
	});
	$(window).on('beforeunload.main', function() {
		// super-trick thanks to http://stackoverflow.com/a/4651049
		// in case another handler displays a confirmation dialog (ex: navigating away
		// during an upload), there are two possible outcomes: user clicked "ok" or
		// "cancel"

		// first timeout handler is called after unload dialog is closed
		setTimeout(function() {
			OC._userIsNavigatingAway = true;

			// second timeout event is only called if user cancelled (Chrome),
			// but in other browsers it might still be triggered, so need to
			// set a higher delay...
			setTimeout(function() {
				if (!OC._unloadCalled) {
					OC._userIsNavigatingAway = false;
				}
			}, 10000);
		},1);
	});
	$(document).on('ajaxError.main', function( event, request, settings ) {
		if (settings && settings.allowAuthErrors) {
			return;
		}
		OC._processAjaxError(request);
	});

	/**
	 * Calls the server periodically to ensure that session and CSRF
	 * token doesn't expire
	 */
	function initSessionHeartBeat() {
		// interval in seconds
		var interval = NaN;
		if (oc_config.session_lifetime) {
			interval = Math.floor(oc_config.session_lifetime / 2);
		}
		interval = isNaN(interval)? 900: interval;

		// minimum one minute
		interval = Math.max(60, interval);
		// max interval in seconds set to 24 hours
		interval = Math.min(24 * 3600, interval);

		var url = OC.generateUrl('/csrftoken');
		setInterval(function() {
			$.ajax(url).then(function(resp) {
				oc_requesttoken = resp.token;
				OC.requestToken = resp.token;
			}).fail(function(e) {
				console.error('session heartbeat failed', e);
			});
		}, interval * 1000);
	}

	// session heartbeat (defaults to enabled)
	if (typeof(oc_config.session_keepalive) === 'undefined' ||
		!!oc_config.session_keepalive) {

		initSessionHeartBeat();
	}

	OC.registerMenu($('#expand'), $('#expanddiv'), false, true);

	// toggle for menus
	//$(document).on('mouseup.closemenus keyup', function(event) {
	$(document).on('mouseup.closemenus', function(event) {

		// allow enter as a trigger
		// if (event.key && event.key !== "Enter") {
		// 	return;
		// }

		var $el = $(event.target);
		if ($el.closest('.menu').length || $el.closest('.menutoggle').length) {
			// don't close when clicking on the menu directly or a menu toggle
			return false;
		}

		OC.hideMenus();
	});

	/**
	 * Set up the main menu toggle to react to media query changes.
	 * If the screen is small enough, the main menu becomes a toggle.
	 * If the screen is bigger, the main menu is not a toggle any more.
	 */
	function setupMainMenu() {

		// init the more-apps menu
		OC.registerMenu($('#more-apps > a'), $('#navigation'));

		// toggle the navigation
		var $toggle = $('#header .header-appname-container');
		var $navigation = $('#navigation');
		var $appmenu = $('#appmenu');

		// init the menu
		OC.registerMenu($toggle, $navigation);
		$toggle.data('oldhref', $toggle.attr('href'));
		$toggle.attr('href', '#');
		$navigation.hide();

		// show loading feedback on more apps list
		$navigation.delegate('a', 'click', function(event) {
			var $app = $(event.target);
			if(!$app.is('a')) {
				$app = $app.closest('a');
			}
			if(event.which === 1 && !event.ctrlKey && !event.metaKey) {
				$app.find('svg').remove();
				$app.find('div').remove(); // prevent odd double-clicks
				// no need for theming, loader is already inverted on dark mode
				// but we need it over the primary colour
				$app.prepend($('<div/>').addClass('icon-loading-small'));
			} else {
				// Close navigation when opening app in
				// a new tab
				OC.hideMenus(function(){return false;});
			}
		});

		$navigation.delegate('a', 'mouseup', function(event) {
			if(event.which === 2) {
				// Close navigation when opening app in
				// a new tab via middle click
				OC.hideMenus(function(){return false;});
			}
		});

		// show loading feedback on visible apps list
		$appmenu.delegate('li:not(#more-apps) > a', 'click', function(event) {
			var $app = $(event.target);
			if(!$app.is('a')) {
				$app = $app.closest('a');
			}

			// trigger redirect
			// needed for ie, but also works for every browser
			window.location = $app.href

			if(event.which === 1 && !event.ctrlKey && !event.metaKey && $app.parent('#more-apps').length === 0) {
				$app.find('svg').remove();
				$app.find('div').remove(); // prevent odd double-clicks
				$app.prepend($('<div/>').addClass(
					OCA.Theming && OCA.Theming.inverted
						? 'icon-loading-small'
						: 'icon-loading-small-dark'
				));
			} else {
				// Close navigation when opening app in
				// a new tab
				OC.hideMenus(function(){return false;});
			}
		});
	}

	function setupUserMenu() {
		var $menu = $('#header #settings');

		// show loading feedback
		$menu.delegate('a', 'click', function(event) {
			var $page = $(event.target);
			if (!$page.is('a')) {
				$page = $page.closest('a');
			}
			if(event.which === 1 && !event.ctrlKey && !event.metaKey) {
				$page.find('img').remove();
				$page.find('div').remove(); // prevent odd double-clicks
				$page.prepend($('<div/>').addClass('icon-loading-small'));
			} else {
				// Close navigation when opening menu entry in
				// a new tab
				OC.hideMenus(function(){return false;});
			}
		});

		$menu.delegate('a', 'mouseup', function(event) {
			if(event.which === 2) {
				// Close navigation when opening app in
				// a new tab via middle click
				OC.hideMenus(function(){return false;});
			}
		});
	}

	function setupContactsMenu() {
		new OC.ContactsMenu({
			el: $('#contactsmenu .menu'),
			trigger: $('#contactsmenu .menutoggle')
		});
	}

	setupMainMenu();
	setupUserMenu();
	setupContactsMenu();

	// move triangle of apps dropdown to align with app name triangle
	// 2 is the additional offset between the triangles
	if($('#navigation').length) {
		$('#header #nextcloud + .menutoggle').on('click', function(){
			$('#menu-css-helper').remove();
			var caretPosition = $('.header-appname + .icon-caret').offset().left - 2;
			if(caretPosition > 255) {
				// if the app name is longer than the menu, just put the triangle in the middle
				return;
			} else {
				$('head').append('<style id="menu-css-helper">#navigation:after { left: '+ caretPosition +'px; }</style>');
			}
		});
		$('#header #appmenu .menutoggle').on('click', function() {
			$('#appmenu').toggleClass('menu-open');
			if($('#appmenu').is(':visible')) {
				$('#menu-css-helper').remove();
			}
		});
	}

	var resizeMenu = function() {
		var appList = $('#appmenu li');
		var rightHeaderWidth = $('.header-right').outerWidth();
		var headerWidth = $('header').outerWidth();
		var usePercentualAppMenuLimit = 0.33;
		var minAppsDesktop = 8;
		var availableWidth =  headerWidth - $('#nextcloud').outerWidth() - (rightHeaderWidth > 210 ? rightHeaderWidth : 210)
		var isMobile = $(window).width() < 768;
		if (!isMobile) {
			availableWidth = availableWidth * usePercentualAppMenuLimit;
		}
		var appCount = Math.floor((availableWidth / $(appList).width()));
		if (isMobile && appCount > minAppsDesktop) {
			appCount = minAppsDesktop;
		}
		if (!isMobile && appCount < minAppsDesktop) {
			appCount = minAppsDesktop;
		}

		// show at least 2 apps in the popover
		if(appList.length-1-appCount >= 1) {
			appCount--;
		}

		$('#more-apps a').removeClass('active');
		var lastShownApp;
		for (var k = 0; k < appList.length-1; k++) {
			var name = $(appList[k]).data('id');
			if(k < appCount) {
				$(appList[k]).removeClass('hidden');
				$('#apps li[data-id=' + name + ']').addClass('in-header');
				lastShownApp = appList[k];
			} else {
				$(appList[k]).addClass('hidden');
				$('#apps li[data-id=' + name + ']').removeClass('in-header');
				// move active app to last position if it is active
				if(appCount > 0 && $(appList[k]).children('a').hasClass('active')) {
					$(lastShownApp).addClass('hidden');
					$('#apps li[data-id=' + $(lastShownApp).data('id') + ']').removeClass('in-header');
					$(appList[k]).removeClass('hidden');
					$('#apps li[data-id=' + name + ']').addClass('in-header');
				}
			}
		}

		// show/hide more apps icon
		if($('#apps li:not(.in-header)').length === 0) {
			$('#more-apps').hide();
			$('#navigation').hide();
		} else {
			$('#more-apps').show();
		}
	};
	$(window).resize(resizeMenu);
	setTimeout(resizeMenu, 0);

	// just add snapper for logged in users
	// and if the app doesn't handle the nav slider itself
	if($('#app-navigation').length && !$('html').hasClass('lte9')
	    && !$('#app-content').hasClass('no-snapper')) {

		// App sidebar on mobile
		var snapper = new Snap({
			element: document.getElementById('app-content'),
			disable: 'right',
			maxPosition: 300, // $navigation-width
			minDragDistance: 100
		});

		$('#app-content').prepend('<div id="app-navigation-toggle" class="icon-menu" style="display:none;" tabindex="0"></div>');

		var toggleSnapperOnButton = function(){
			if(snapper.state().state == 'left'){
				snapper.close();
			} else {
				snapper.open('left');
			}
		};

		$('#app-navigation-toggle').click(function(){
			toggleSnapperOnButton();
		});

		$('#app-navigation-toggle').keypress(function(e) {
			if(e.which == 13) {
				toggleSnapperOnButton();
			}
		});

		// close sidebar when switching navigation entry
		var $appNavigation = $('#app-navigation');
		$appNavigation.delegate('a, :button', 'click', function(event) {
			var $target = $(event.target);
			// don't hide navigation when changing settings or adding things
			if($target.is('.app-navigation-noclose') ||
				$target.closest('.app-navigation-noclose').length) {
				return;
			}
			if($target.is('.app-navigation-entry-utils-menu-button') ||
				$target.closest('.app-navigation-entry-utils-menu-button').length) {
				return;
			}
			if($target.is('.add-new') ||
				$target.closest('.add-new').length) {
				return;
			}
			if($target.is('#app-settings') ||
				$target.closest('#app-settings').length) {
				return;
			}
			snapper.close();
		});

		var navigationBarSlideGestureEnabled = false;
		var navigationBarSlideGestureAllowed = true;
		var navigationBarSlideGestureEnablePending = false;

		OC.allowNavigationBarSlideGesture = function() {
			navigationBarSlideGestureAllowed = true;

			if (navigationBarSlideGestureEnablePending) {
				snapper.enable();

				navigationBarSlideGestureEnabled = true;
				navigationBarSlideGestureEnablePending = false;
			}
		};

		OC.disallowNavigationBarSlideGesture = function() {
			navigationBarSlideGestureAllowed = false;

			if (navigationBarSlideGestureEnabled) {
				var endCurrentDrag = true;
				snapper.disable(endCurrentDrag);

				navigationBarSlideGestureEnabled = false;
				navigationBarSlideGestureEnablePending = true;
			}
		};

		var toggleSnapperOnSize = function() {
			if($(window).width() > 768) {
				snapper.close();
				snapper.disable();

				navigationBarSlideGestureEnabled = false;
				navigationBarSlideGestureEnablePending = false;
			} else if (navigationBarSlideGestureAllowed) {
				snapper.enable();

				navigationBarSlideGestureEnabled = true;
				navigationBarSlideGestureEnablePending = false;
			} else {
				navigationBarSlideGestureEnablePending = true;
			}
		};

		$(window).resize(_.debounce(toggleSnapperOnSize, 250));

		// initial call
		toggleSnapperOnSize();

	}

	// Update live timestamps every 30 seconds
	setInterval(function() {
		$('.live-relative-timestamp').each(function() {
			$(this).text(OC.Util.relativeModifiedDate(parseInt($(this).attr('data-timestamp'), 10)));
		});
	}, 30 * 1000);

	OC.PasswordConfirmation.init();
}

$(document).ready(initCore);

// fallback to hashchange when no history support
if (window.history.pushState) {
	window.onpopstate = _.bind(OC.Util.History._onPopState, OC.Util.History);
}
else {
	$(window).on('hashchange', _.bind(OC.Util.History._onPopState, OC.Util.History));
}

/**
 * Get a variable by name
 * @param {string} name
 * @return {*}
 */
OC.get=function(name) {
	var namespaces = name.split(".");
	var tail = namespaces.pop();
	var context=window;

	for(var i = 0; i < namespaces.length; i++) {
		context = context[namespaces[i]];
		if(!context){
			return false;
		}
	}
	return context[tail];
};

/**
 * Set a variable by name
 * @param {string} name
 * @param {*} value
 */
OC.set=function(name, value) {
	var namespaces = name.split(".");
	var tail = namespaces.pop();
	var context=window;

	for(var i = 0; i < namespaces.length; i++) {
		if(!context[namespaces[i]]){
			context[namespaces[i]]={};
		}
		context = context[namespaces[i]];
	}
	context[tail]=value;
};


$(document).on('ajaxSend',function(elm, xhr, settings) {
	if(settings.crossDomain === false) {
		xhr.setRequestHeader('requesttoken', oc_requesttoken);
		xhr.setRequestHeader('OCS-APIREQUEST', 'true');
	}
});


/**
 * @author Roeland Jago Douma <roeland@famdouma.nl>
 *
 * @copyright Copyright (c) 2015, ownCloud, Inc.
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License, version 3,
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License, version 3,
 * along with this program.  If not, see <http://www.gnu.org/licenses/>
 *
 */

/**
 * Namespace to hold functions related to convert mimetype to icons
 *
 * @namespace
 */
OC.MimeType = {

	/**
	 * Cache that maps mimeTypes to icon urls
	 */
	_mimeTypeIcons: {},

	/**
	 * Return the file icon we want to use for the given mimeType.
	 * The file needs to be present in the supplied file list
	 *
	 * @param {string} mimeType The mimeType we want an icon for
	 * @param {array} files The available icons in this theme
	 * @return {string} The icon to use or null if there is no match
	 */
	_getFile: function(mimeType, files) {
		var icon = mimeType.replace(new RegExp('/', 'g'), '-');

		// Generate path
		if (mimeType === 'dir' && $.inArray('folder', files) !== -1) {
			return 'folder';
		} else if (mimeType === 'dir-encrypted' && $.inArray('folder-encrypted', files) !== -1) {
			return 'folder-encrypted';
		} else if (mimeType === 'dir-shared' && $.inArray('folder-shared', files) !== -1) {
			return 'folder-shared';
		} else if (mimeType === 'dir-public' && $.inArray('folder-public', files) !== -1) {
			return 'folder-public';
		} else if (mimeType === 'dir-external' && $.inArray('folder-external', files) !== -1) {
			return 'folder-external';
		} else if ($.inArray(icon, files) !== -1) {
			return icon;
		} else if ($.inArray(icon.split('-')[0], files) !== -1) {
			return icon.split('-')[0];
		} else if ($.inArray('file', files) !== -1) {
			return 'file';
		}

		return null;
	},

	/**
	 * Return the url to icon of the given mimeType
	 *
	 * @param {string} mimeType The mimeType to get the icon for
	 * @return {string} Url to the icon for mimeType
	 */
	getIconUrl: function(mimeType) {
		if (_.isUndefined(mimeType)) {
			return undefined;
		}

		while (mimeType in OC.MimeTypeList.aliases) {
			mimeType = OC.MimeTypeList.aliases[mimeType];
		}
		if (mimeType in OC.MimeType._mimeTypeIcons) {
			return OC.MimeType._mimeTypeIcons[mimeType];
		}

		// First try to get the correct icon from the current theme
		var gotIcon = null;
		var path = '';
		if (OC.theme.folder !== '' && $.isArray(OC.MimeTypeList.themes[OC.theme.folder])) {
			path = OC.getRootPath() + '/themes/' + OC.theme.folder + '/core/img/filetypes/';
			var icon = OC.MimeType._getFile(mimeType, OC.MimeTypeList.themes[OC.theme.folder]);

			if (icon !== null) {
				gotIcon = true;
				path += icon;
			}
		}
		if(OCA.Theming && gotIcon === null) {
			path = OC.generateUrl('/apps/theming/img/core/filetypes/');
			path += OC.MimeType._getFile(mimeType, OC.MimeTypeList.files);
			gotIcon = true;
		}

		// If we do not yet have an icon fall back to the default
		if (gotIcon === null) {
			path = OC.getRootPath() + '/core/img/filetypes/';
			path += OC.MimeType._getFile(mimeType, OC.MimeTypeList.files);
		}

		path += '.svg';

		if(OCA.Theming) {
			path += "?v=" + OCA.Theming.cacheBuster;
		}

		// Cache the result
		OC.MimeType._mimeTypeIcons[mimeType] = path;
		return path;
	}

};


/**
* This file is automatically generated
* DO NOT EDIT MANUALLY!
*
* You can update the list of MimeType Aliases in config/mimetypealiases.json
* The list of files is fetched from core/img/filetypes
* To regenerate this file run ./occ maintenance:mimetype:update-js
*/
OC.MimeTypeList={
	aliases: {
    "application/coreldraw": "image",
    "application/epub+zip": "text",
    "application/font-sfnt": "image",
    "application/font-woff": "image",
    "application/gpx+xml": "location",
    "application/illustrator": "image",
    "application/javascript": "text/code",
    "application/json": "text/code",
    "application/msaccess": "file",
    "application/msexcel": "x-office/spreadsheet",
    "application/msonenote": "x-office/document",
    "application/mspowerpoint": "x-office/presentation",
    "application/msword": "x-office/document",
    "application/octet-stream": "file",
    "application/postscript": "image",
    "application/rss+xml": "application/xml",
    "application/vnd.android.package-archive": "package/x-generic",
    "application/vnd.lotus-wordpro": "x-office/document",
    "application/vnd.garmin.tcx+xml": "location",
    "application/vnd.google-earth.kml+xml": "location",
    "application/vnd.google-earth.kmz": "location",
    "application/vnd.ms-excel": "x-office/spreadsheet",
    "application/vnd.ms-excel.addin.macroEnabled.12": "x-office/spreadsheet",
    "application/vnd.ms-excel.sheet.binary.macroEnabled.12": "x-office/spreadsheet",
    "application/vnd.ms-excel.sheet.macroEnabled.12": "x-office/spreadsheet",
    "application/vnd.ms-excel.template.macroEnabled.12": "x-office/spreadsheet",
    "application/vnd.ms-fontobject": "image",
    "application/vnd.ms-powerpoint": "x-office/presentation",
    "application/vnd.ms-powerpoint.addin.macroEnabled.12": "x-office/presentation",
    "application/vnd.ms-powerpoint.presentation.macroEnabled.12": "x-office/presentation",
    "application/vnd.ms-powerpoint.slideshow.macroEnabled.12": "x-office/presentation",
    "application/vnd.ms-powerpoint.template.macroEnabled.12": "x-office/presentation",
    "application/vnd.ms-visio.drawing.macroEnabled.12": "application/vnd.visio",
    "application/vnd.ms-visio.drawing": "application/vnd.visio",
    "application/vnd.ms-visio.stencil.macroEnabled.12": "application/vnd.visio",
    "application/vnd.ms-visio.stencil": "application/vnd.visio",
    "application/vnd.ms-visio.template.macroEnabled.12": "application/vnd.visio",
    "application/vnd.ms-visio.template": "application/vnd.visio",
    "application/vnd.ms-word.document.macroEnabled.12": "x-office/document",
    "application/vnd.ms-word.template.macroEnabled.12": "x-office/document",
    "application/vnd.oasis.opendocument.presentation": "x-office/presentation",
    "application/vnd.oasis.opendocument.presentation-template": "x-office/presentation",
    "application/vnd.oasis.opendocument.spreadsheet": "x-office/spreadsheet",
    "application/vnd.oasis.opendocument.spreadsheet-template": "x-office/spreadsheet",
    "application/vnd.oasis.opendocument.text": "x-office/document",
    "application/vnd.oasis.opendocument.text-master": "x-office/document",
    "application/vnd.oasis.opendocument.text-template": "x-office/document",
    "application/vnd.oasis.opendocument.text-web": "x-office/document",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "x-office/presentation",
    "application/vnd.openxmlformats-officedocument.presentationml.slideshow": "x-office/presentation",
    "application/vnd.openxmlformats-officedocument.presentationml.template": "x-office/presentation",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "x-office/spreadsheet",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.template": "x-office/spreadsheet",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "x-office/document",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.template": "x-office/document",
    "application/vnd.visio": "x-office/document",
    "application/vnd.wordperfect": "x-office/document",
    "application/x-7z-compressed": "package/x-generic",
    "application/x-bzip2": "package/x-generic",
    "application/x-cbr": "text",
    "application/x-compressed": "package/x-generic",
    "application/x-dcraw": "image",
    "application/x-deb": "package/x-generic",
    "application/x-fictionbook+xml": "text",
    "application/x-font": "image",
    "application/x-gimp": "image",
    "application/x-gzip": "package/x-generic",
    "application/x-iwork-keynote-sffkey": "x-office/presentation",
    "application/x-iwork-numbers-sffnumbers": "x-office/spreadsheet",
    "application/x-iwork-pages-sffpages": "x-office/document",
    "application/x-mobipocket-ebook": "text",
    "application/x-perl": "text/code",
    "application/x-photoshop": "image",
    "application/x-php": "text/code",
    "application/x-rar-compressed": "package/x-generic",
    "application/x-tar": "package/x-generic",
    "application/x-tex": "text",
    "application/xml": "text/html",
    "application/yaml": "text/code",
    "application/zip": "package/x-generic",
    "database": "file",
    "httpd/unix-directory": "dir",
    "text/css": "text/code",
    "text/csv": "x-office/spreadsheet",
    "text/html": "text/code",
    "text/x-c": "text/code",
    "text/x-c++src": "text/code",
    "text/x-h": "text/code",
    "text/x-java-source": "text/code",
    "text/x-ldif": "text/code",
    "text/x-python": "text/code",
    "text/x-shellscript": "text/code",
    "web": "text/code",
    "application/internet-shortcut": "link"
},
	files: [
    "application",
    "application-pdf",
    "audio",
    "file",
    "folder",
    "folder-drag-accept",
    "folder-encrypted",
    "folder-external",
    "folder-public",
    "folder-shared",
    "folder-starred",
    "image",
    "link",
    "location",
    "package-x-generic",
    "text",
    "text-calendar",
    "text-code",
    "text-vcard",
    "video",
    "x-office-document",
    "x-office-presentation",
    "x-office-spreadsheet"
],
	themes: []
};


/*
 * Copyright (c) 2015
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */

/* global Select2 */

/**
 * Select2 extension for toggling values in a multi-select dropdown
 */
(function(Select2) {

	var Select2FindHighlightableChoices = Select2.class.multi.prototype.findHighlightableChoices;
	Select2.class.multi.prototype.findHighlightableChoices = function () {
		if (this.opts.toggleSelect) {
			return this.results.find('.select2-result-selectable:not(.select2-disabled)');
		}
		return Select2FindHighlightableChoices.apply(this, arguments);
	};

	var Select2TriggerSelect = Select2.class.multi.prototype.triggerSelect;
	Select2.class.multi.prototype.triggerSelect = function (data) {
		if (this.opts.toggleSelect && this.val().indexOf(this.id(data)) !== -1) {
			var self = this;
			var val = this.id(data);

			var selectionEls = this.container.find('.select2-search-choice').filter(function() {
				return (self.id($(this).data('select2-data')) === val);
			});

			if (this.unselect(selectionEls)) {
				// also unselect in dropdown
				this.results.find('.select2-result.select2-selected').each(function () {
					var $this = $(this);
					if (self.id($this.data('select2-data')) === val) {
						$this.removeClass('select2-selected');
					}
				});
				this.clearSearch();
			}

			return false;
		} else {
			return Select2TriggerSelect.apply(this, arguments);
		}
	};

})(Select2);



