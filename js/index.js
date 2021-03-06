
pagesTracker = [];
pagesTracker.push('main_page');
var pushNotification;
getUsersRequest = '';
checkNewMessagesRequest = '';
newMessages = '';
refreshChat = '';
checkBingo = '';
ref = '';
checkStatus = '';


var app = {

	apiUrl : 'http://m.richdate.co.il',
	pictureSource : '',
	destinationType : '',
	encodingType : '',
	backPage : '',
	currentPageId : '',
	currentPageWrapper : '',
	recentScrollPos : '',

	action : '',
	requestUrl : '',
	requestMethod : '',
	response : '',
	responseItemsNumber : '',
	pageNumber : 1,
	itemsPerPage : 30,
	container : '',
	template : '',
	statAction : '',
	searchFuncsMainCall: '',
	sort: '',

	profileGroupTemplate : '',
	profileLineTemplate : '',
	profileLineTemplate2 : '',

	userId : '',
	reportAbuseUserId : '',
	gcmDeviceId : '',
	imageId : '',
	positionSaved : false,
	logged: false,
	exit: false,
	newMessagesCount : 0,
	newNotificationsCount: 0,
    contactCurrentAllMessagesNumber : 0,
    contactCurrentReadMessagesNumber : 0,

    swiper: null,
    bingoIsActive: false,
    bingos: [],
    version: '1.8.1',


	init: function(){
		window.open = cordova.InAppBrowser.open;
		app.ajaxSetup();
		app.chooseMainPage();
		app.pictureSource = navigator.camera.PictureSourceType;
		app.destinationType = navigator.camera.DestinationType;
		app.encodingType = navigator.camera.EncodingType;
		//$('#login_page').css({'height':($('#mainContainer').height()-50)+'px !important'});
	},

	ajaxSetup: function(){

		var user = window.localStorage.getItem("user");
		var pass = window.localStorage.getItem("pass");

		if(user == '' && pass == ''){
			user = 'nouser';
			pass = 'nopass';
		}

		$.ajaxSetup({
			dataType: 'json',
			type: 'Get',
			timeout: 50000,
			beforeSend: function(xhr){
				//alert(user + ':' + pass);
				xhr.setRequestHeader ("Authorization", "Basic " + btoa ( user + ":" + pass) );
				xhr.setRequestHeader ("appVersion", app.version);
			},
			statusCode:{

				403: function(response, textStatus, xhr){

					app.stopLoading();
					app.showPage('login_page');
					document.removeEventListener("backbutton", app.back, false);
					//app.printUsers();JSON.stringify();
					var resArr = response.responseText.split('{');
                    if(resArr.length == 1){
                    	resArr[1] = '}';
                    }
                    var resp = JSON.parse('{' + resArr[1]);
					var url = false;
					if(typeof resp.url != 'undefined'){
						url = resp.url;
					}

					//if(app.exit===false){
						app.alert(resArr[0], url);
					//}
                },

				406: function(response, textStatus, xhr){
                	$('body').html(response.responseText);
                }

			},

			error: function(response, textStatus, errorThrown){
				app.stopLoading();
				//alert(JSON.stringify(response));
				//alert(JSON.stringify(textStatus));
				//alert(JSON.stringify(errorThrown));
				//alert(response.status + ':' + errorThrown );
			},

			complete: function(response, status, jqXHR){
				//alert(response.status);
				console.log("AJAX COMPLETE");
				var resArr = response.responseText.split('{');
                if(resArr.length == 1){
                	resArr[1] = '}';
                }
                resArr = resArr.slice(1);
                var resp = JSON.parse('{' + resArr.join("{"));
				//alert(JSON.stringify(resp));
				if(typeof resp.logged !== 'undefined'){
				    if(resp.logged !== app.logged && resp.userId !== null){
				        ref.close();
                        app.chooseMainPage();
				    }
				}
				app.stopLoading();


			},
		});
	},

	alert: function(message, url){

    	navigator.notification.alert(
    		 message,
    		 function(){
    		 	if(typeof url != 'undefined' && url != false){
                	ref = cordova.InAppBrowser.open(url, '_blank', 'location=yes');
                }
                return false;
    		 },
    		 'Notification',
    		 'Ok'
    	);
    },

	logout:function(){

		app.startLoading();
		$(window).unbind('scroll');
        clearTimeout(newMessages);

        if(checkNewMessagesRequest != ''){
        	checkNewMessagesRequest.abort();
        	console.log("Abort checkNewMessagesRequest");
        }

        if(getUsersRequest != ''){
        	getUsersRequest.abort();
        	console.log("Abort getUsersRequest");
        }

		pagesTracker = [];
		pagesTracker.push('login_page');
		app.exit = true;

		$.ajax({
			url: app.apiUrl + '/api/v4/user/logout',
			success: function(data, status){

				if(data.logout == 1){
					app.logged = false;
					//alert(JSON.stringify(data));
					app.positionSaved = false;
					window.localStorage.setItem("userId", "");
					window.localStorage.setItem("user", "");
					window.localStorage.setItem("pass", "");
					//alert(JSON.stringify(data));
					app.UIHandler();
					app.ajaxSetup();
					app.stopLoading();
				}
			},
			error: function(response, textStatus, errorThrown){
            	//alert(JSON.stringify(response));
            },
            complete: function(response, status, jqXHR){
            	//alert(JSON.stringify(response));
            }
		});
	},

	UIHandler: function(){

		document.removeEventListener("backbutton", app.back, false);

		if(app.logged === false){

			var userInput = window.localStorage.getItem("userInput");
			//alert(userInput);
   			if(userInput != 'null')
				$('#user_input').find('input').val(userInput);

			$('.appPage').hide();
			$('.new_mes').hide();
			$('#likesNotifications').hide();
			$("#login_page").show();
			$('#back').hide();
			$('#logout').hide();
			$('#contact').hide();
			$('#sign_up').show();
			//app.printUsers();
			app.currentPageId = 'login_page';
			app.currentPageWrapper = $('#'+app.currentPageId);
		}
		else{
			$('.appPage').hide();
			$("#main_page").show();
			$('#back').hide();
			$('#logout').show();
			$('#sign_up').hide();

			//$('#contact').show();
			if(app.logged == 'nopay'){
				$('#likesNotifications').hide();
				document.addEventListener("pause", navigator.app.exitApp, false);
				app.currentPageId = 'main_page';
				app.currentPageWrapper = $('#'+app.currentPageId);
				app.currentPageWrapper.find('.mainBut').hide();
				app.getSubscription();
			}
			if(app.logged == 'noimg'){
			    $('#likesNotifications').css({left:'auto',right:'0px'}).show();
				app.getRegStep();
			}
			if(app.logged === true){
			    $('#likesNotifications').css({left:'auto',right:'0px'}).show();
				document.removeEventListener("pause", navigator.app.exitApp, false);
				app.currentPageId = 'main_page';
				app.currentPageWrapper = $('#'+app.currentPageId);
				app.currentPageWrapper.find('.mainBut').show();
			}
		}
	},

	loggedUserInit: function(){
        app.pushNotificationInit();
		app.searchFuncsMainCall = true;
		app.setBannerDestination();
		app.checkNewMessages();
		app.checkBingo();
		app.sendUserPosition();
	},

	startLoading: function(){
		navigator.notification.activityStart(
				'טעינה',
				'אנא המתן...');
	},

	stopLoading: function(){
		navigator.notification.activityStop();
	},

	chooseMainPage: function(){

		pagesTracker = [];
		pagesTracker.push('main_page');
		app.startLoading();
		app.exit = false;

		$.ajax({
			url: app.apiUrl + '/api/v4/user/login1',
			error: function(response){
				//alert(JSON.stringify(response));
			},
			statusCode:{
				403: function(response, status, xhr){
					app.logged = false;
					app.UIHandler();
				}
			},
			success: function(data, status){
				if(data.userId > 0){
					//alert(data.logged);
					app.response = data;
					app.logged = data.logged;
					window.localStorage.setItem("userId", data.userId);
					app.UIHandler();
					app.loggedUserInit();
					$(window).unbind("scroll");
					window.scrollTo(0, 0);
				}
			}
		});
	},

	setBannerDestination: function(){
		$.ajax({
			url: app.apiUrl + '/api/v4/user/banner',
			success: function(response, status){
				app.response = response;
				//alert(JSON.stringify(app.response));
				$('#bannerLink').attr("onclick",app.response.banner.func);
				if(app.response.banner.src!==''){
					$('#why_subscr').find('.ui-btn').hide();
					if($('#bannerLink').find("img").size()===0)
						$('#why_subscr').append('<img src="'+app.response.banner.src+'" />');
					else{
						$('#bannerLink').find("img").attr("src",app.response.banner.src);
						$('#bannerLink').find("img").show();
					}
				}else{
					$('#bannerLink').find("img").hide();
					$('#why_subscr').find('.ui-btn').show();
				}
			}
		});
	},



	sendAuthData: function(){
		var userInput = $("#authForm .email").val();
		var pass = $("#authForm .password").val();
		app.exit = false;
		user = unescape(encodeURIComponent(userInput));
		pass = unescape(encodeURIComponent(pass));
		window.localStorage.setItem("user",user);
		window.localStorage.setItem("pass",pass);
		$.ajax({
			url: app.apiUrl + '/api/v4/user/login1',
			beforeSend: function(xhr){
				user = window.localStorage.getItem("user");
				pass = window.localStorage.getItem("pass");
				xhr.setRequestHeader ("Authorization", "Basic " + btoa ( user + ":" + pass) );
			},
			success: function(data, status){
				if(data.userId > 0){
					app.logged = data.logged;
					window.localStorage.setItem("userId", data.userId);
                    window.localStorage.setItem("userInput", userInput);
					app.ajaxSetup();
					app.showPage('main_page');
					$('#logout').show();
					if(app.logged == 'nopay'){
					    app.response = data;
						app.currentPageWrapper.find('.mainBut').hide();
						app.getSubscription();
					}
					if(app.logged == 'noimg'){
					    app.response = data;
						app.getRegStep();
					}
					if(app.logged === true){
						app.currentPageWrapper.find('.mainBut').show();
					}
					app.loggedUserInit();
					//document.removeEventListener("backbutton", app.back, false);
					window.scrollTo(0, 0);
				}
				//alert(JSON.stringify(data));
			}
		});
	},

	sendUserPosition: function(){
		if(app.positionSaved === false){
			navigator.geolocation.getCurrentPosition(app.persistUserPosition, app.userPositionError, { enableHighAccuracy: true, timeout: 15000 });
		}
	},

	persistUserPosition: function(position){
		var data = {
			longitude: position.coords.longitude,
			latitude: position.coords.latitude
		};

		//alert(JSON.stringify(data));
		//return;

		$.ajax({
			url: app.apiUrl + '/api/v4/user/location',
			type: 'Post',
			data:JSON.stringify(data),
			success: function(response){
				app.response = response;
				app.positionSaved = app.response.result;
			}
		});
	},

	userPositionError: function(error){
	    //alert(error.message);
		console.log('code: '    + error.code    + '\n' +
	          'message: ' + error.message + '\n');
	},

	printUsers: function(){
		$.ajax({
			url: app.apiUrl + '/api/v4/users/recently_visited/2',
			success: function(data, status){
				for ( var i = 0; i < data.users.length; i++) {
					$("#udp_"+i).find(".user_photo_wrap .user_photo").attr("src",data.users[i].mainImage.url);
					$("#udp_"+i).find("span").text(data.users[i].nickName);
					$("#udp_"+i).find(".address").text(data.users[i].city);
				}
				//$(".user_data_preview").slideToggle("slow");
				$(".user_data_preview").show();
			}
		});
	},

	contact: function(){
		//window.location.href = 'http://dating4disabled.com/contact.asp';
	},

	pushNotificationInit: function() {

		var push = PushNotification.init({
			android: {
				senderID: "854262669808",
				icon: "icon",
				iconColor: "silver",
			}
		});

		push.on('registration', function (data) {
			// data.registrationId

			console.log(JSON.stringify(data));

			app.gcmDeviceId = data.registrationId;
			app.persistGcmDeviceId();
		});

		push.on('notification', function (data) {

			/*
			 console.log(JSON.stringify(data));

			 var count = push.getApplicationIconBadgeNumber(app.badgeNumberSuccessHandler, app.badgeNumberErrorHandler);

			 count = count === undefined ? 1 : count + 1;

			 console.log("COUNT: " + count);

			 push.setApplicationIconBadgeNumber(
			 app.badgeNumberSuccessHandler,
			 app.badgeNumberErrorHandler,
			 count
			 );
			 */

			 if(!data.additionalData.foreground || app.currentPageId == 'messenger_page'){
			    app.getMessenger();
			 }
        });

		push.on('error', function (e) {

			console.log("PUSH PLUGIN ERROR: " + JSON.stringify(e));

			//e.message
		});

	},

	persistGcmDeviceId: function(){
		//alert(app.gcmDeviceId);

		$.ajax({
			url: app.apiUrl + '/api/v4/user/deviceId/OS:Android',
			type: 'Post',
			data: JSON.stringify({deviceId: app.gcmDeviceId}),
			error: function(data, status){
				console.log("PUSH ERROR: " + JSON.stringify(data));
			},
			success: function(data, status){
				console.log(JSON.stringify(data));
			}
		});
	},

	getSettings: function(name, value){

		app.startLoading();


		$.ajax({
			url: app.apiUrl + '/api/v4/user/settings',
			type: 'Get',
			error: function(response){
				console.log(JSON.stringify(response));
			},
			success: function(response){
				console.log(response);

				var val  = response.settings.newMessPushNotif == '1' ? 1 : 0;
				$('#push_notif').val(val).slider("refresh").bind( "change",
						function(event, ui) {
							app.changeSettings($(this).attr('name'), $(this).val());
						}
				);


				app.showPage('settings_page');
				app.stopLoading();
			},
		});
	},

	changeSettings: function(name, value){

		console.log(value);

		$.ajax({
			url: app.apiUrl + '/api/v4/user/settings/' + name + '/' + value,
			type: 'Post',
			error: function(response){
				console.log(JSON.stringify(response));
			},
			success: function(data){
				console.log(data);

			},
		});
	},






	/*pushNotificationInit: function(){

		try{
        	pushNotification = window.plugins.pushNotification;
        	if (device.platform == 'android' || device.platform == 'Android') {
				//alert('registering android');
            	pushNotification.register(app.regSuccessGCM, app.regErrorGCM, {"senderID":"48205136182","ecb":"app.onNotificationGCM"});		// required!

			}
        }
		catch(err){
			txt="There was an error on this page.\n\n";
			txt+="Error description: " + err.message + "\n\n";
			alert(txt);

		}

	},

	// handle GCM notifications for Android
    onNotificationGCM: function(e) {
    	//alert(1);
    	//console.log('EVENT -> RECEIVED:' + e.event);
        switch( e.event ){
            case 'registered':
            	//alert("registered");
			if ( e.regid.length > 0 ){
				// Your GCM push server needs to know the regID before it can push to this device
				// here is where you might want to send it the regID for later use.
				//alert("REGISTERED -> REGID:" + e.regid);

				app.gcmDeviceId = e.regid;
				app.persistGcmDeviceId();
			}
            break;


            case 'message':
            	// if this flag is set, this notification happened while we were in the foreground.
            	// you might want to play a sound to get the user's attention, throw up a dialog, etc.
            	if (e.foreground){
					// if the notification contains a soundname, play it.
					//var my_media = new Media("/android_asset/www/"+e.soundname);
					//my_media.play();

            		if(app.currentPageId == 'messenger_page'){
            			app.getMessenger();
            		}


            		app.checkNewMessages();

				}
				else
				{	// otherwise we were launched because the user touched a notification in the notification tray.

					if (e.coldstart){
						console.log('COLDSTART NOTIFICATION');
						app.getMessenger();
					}
					else{
						console.log('--BACKGROUND NOTIFICATION--');
						app.getMessenger();
					}

					//app.getMessenger();
				}
            	//console.log('MESSAGE -> MSG: ' + e.payload.message);
            	//console.log('MESSAGE -> MSGCNT: ' + e.payload.msgcnt);
            	//alert(e.payload.message);




            break;

            case 'error':
            	console.log('ERROR -> MSG:' + e.msg);
            break;

            default:
            	console.log('EVENT -> Unknown, an event was received and we do not know what it is');
            break;
        }
    },

    persistGcmDeviceId: function(){
    	$.ajax({
			url: app.apiUrl + '/api/v4/user/gcmDeviceId',
			type: 'Post',
			data: JSON.stringify({
				gcmDeviceId: app.gcmDeviceId
			}),
			success: function(data, status){
				//alert(data.persisting);
			}
		});

    },

    tokenHandler: function(result) {
        //console.log('success:'+ result);
        // Your iOS push server needs to know the token before it can push to this device
        // here is where you might want to send it the token for later use.
    },

    regSuccessGCM: function (result) {
    	//alert('success:'+ result);
    },

    regErrorGCM: function (error) {
    	//alert('error:'+ error);
    },*/

	back: function(){
		$(window).unbind("scroll");
		window.scrollTo(0, 0);
		pagesTracker.splice(pagesTracker.length-1,1);
		var prevPage = pagesTracker[pagesTracker.length-1];

		if(typeof prevPage == "undefined" || prevPage == "main_page" ||  prevPage == "login_page")
			//app.showPage('main_page');
			app.chooseMainPage();
		else
			app.showPage(prevPage);

		if(app.currentPageId == 'users_list_page'){
			app.template = $('#userDataTemplate').html();
			window.scrollTo(0, app.recentScrollPos);
			app.setScrollEventHandler(2500,3500);
		}
		else if(app.currentPageId == 'messenger_page'){
        	app.template = $('#messengerTemplate').html();
        	console.log(app.recentScrollPos);
        	window.scrollTo(0, app.recentScrollPos);
        	app.setScrollEventHandler(1000,2000);

        }

		app.searchFuncsMainCall = true;
		app.stopLoading();
	},

	showPage: function(page){
		app.currentPageId = page;
		app.currentPageWrapper = $('#'+app.currentPageId);
		app.container = app.currentPageWrapper.find('.content_wrap');
		if(pagesTracker.indexOf(app.currentPageId)!=-1){
			pagesTracker.splice(pagesTracker.length-1,pagesTracker.indexOf(app.currentPageId));

		}
		if(pagesTracker.indexOf(app.currentPageId) == -1){
			pagesTracker.push(app.currentPageId);
		}
		$('.appPage').hide();
		//alert('1');
		app.currentPageWrapper.show();

		console.log(app.currentPageId);

		if(app.currentPageId == 'main_page'){
			$('#back').hide();
			$('#sign_up').hide();
			//$('#contact').show();
			$('#likesNotifications').css({left:'auto',right:'0px'}).show();
			$('#logout').show();
		}
		else if(app.currentPageId == 'login_page'){
			$('#back').hide();
			$('#sign_up').show();
			$('#contact').hide();
			$('#logout').hide();
			$('#likesNotifications').hide();
		}
		else{
			$('#back').show();
			$('#sign_up').hide();
			$('#contact').hide();
			$('#logout').hide();
			document.addEventListener("backbutton", app.back, false);
			$('#likesNotifications').removeAttr('style').show();
		}

		if(app.currentPageId == 'register_page' || app.currentPageId == 'recovery_page'){
        	$('#likesNotifications').hide();
        }
		$(window).unbind("scroll");

	},

	sortByDistance: function(){
		app.sort = 'distance';
		$('#sortByDistance').hide();
		$('#sortByEntranceTime').show();
		app.chooseSearchFunction();
	},

	sortByEntranceTime: function(){
		app.sort = '';
		$('#sortByEntranceTime').hide();
		$('#sortByDistance').show();
		app.chooseSearchFunction();
	},

	chooseSearchFunction: function(){

		app.searchFuncsMainCall = false;

		if(app.action == 'getOnlineNow'){
			app.getOnlineNow();
		}
		else if(app.action == 'getSearchResults'){
			app.search();
		}
		else if(app.action == 'getStatResults'){
			app.getStatUsers(app.statAction);
		}
	},

	getOnlineNow: function(){
		app.showPage('users_list_page');
		app.currentPageWrapper.find('.content_wrap').html('');
		app.template = $('#userDataTemplate').html();
		app.container = app.currentPageWrapper.find('.content_wrap');
		app.container.append('<h1>תוצאות</h1><div class="dots"></div>');
		app.action = 'getOnlineNow';
		app.pageNumber = 1;
		app.getUsers();
	},


	getUsers: function(){

		if(app.pageNumber == 1){
			app.startLoading();
		}

		if(app.searchFuncsMainCall === true && app.positionSaved === true){
			$('#sortByEntranceTime').hide();
			$('#sortByDistance').show();
			app.sort = '';
		}

		if(app.action == 'getOnlineNow'){
			app.requestUrl = app.apiUrl + '/api/v4/users/online/count:'+app.itemsPerPage+'/page:'+app.pageNumber+'/sort:'+app.sort;
		}
		else if(app.action == 'getSearchResults'){
			//var countryCode = $('#countries_list').val();
			var region = $('.regionsList select').val();
			var ageFrom = $(".age_1 select").val();
			var ageTo = $(".age_2 select").val();
			var nickName = $('.nickName').val();
			app.requestUrl = app.apiUrl + '/api/v4/users/search/region:'+region+'/age:'+ageFrom+'-'+ageTo+'/nickName:'+nickName+'/count:'+app.itemsPerPage+'/page:'+app.pageNumber+'/sort:'+app.sort;
		}
		else if(app.action == 'getStatResults'){
			app.requestUrl = app.apiUrl + '/api/v4/user/statistics/'+app.statAction+'/count:'+app.itemsPerPage+'/page:'+app.pageNumber+'/sort:'+app.sort;
		}

		$.ajax({
			url: app.requestUrl,
			timeout:10000,
			success: function(response, status){
				app.response = response;
				//alert(JSON.stringify(app.response));
				app.displayUsers();
			},
			error: function(err){
				//alert(JSON.stringify(err));
			}
		});
	},


	displayUsers: function(){
		//app.container.parent('div').append('<h1>תוצאות</h1>');

		app.stopLoading();

		if(app.currentPageId == 'users_list_page'){

			$('.loadingHTML').remove();

        	var userId = window.localStorage.getItem("userId");

        	if(app.response.users.itemsNumber == 0){
        		app.container.append('<div class="center noResults">אין תוצאות</div>')
        		return;
        	}


			for(var i in app.response.users.items){
				var currentTemplate = app.template;
				var user = app.response.users.items[i];
				currentTemplate = currentTemplate.replace("[USERNICK]",user.nickName);
				currentTemplate = currentTemplate.replace("[AGE]",user.age);
				//currentTemplate = currentTemplate.replace("[COUNTRY]",user.country+',');
				currentTemplate = currentTemplate.replace("[CITY]",user.city);
				currentTemplate = currentTemplate.replace("[IMAGE]",user.mainImage.url);
				currentTemplate = currentTemplate.replace(/\[USERNICK\]/g,user.nickName);
				currentTemplate = currentTemplate.replace("[USER_ID]", user.id);
				var aboutUser = user.about;
				//if(typeof(user.about) === 'string'){
				//	if(user.about.length > 90){
				//		aboutUser = user.about.substring(0,90)+'...';
				//	}
				//	else{
				//		aboutUser = user.about;
				//	}
				//}
				//alert(aboutUser);

				if(aboutUser == null)
                	aboutUser = '...';

				currentTemplate = currentTemplate.replace("[ABOUT]", aboutUser);
				app.container.append(currentTemplate);
				var currentUserNode = app.container.find(".user_data:last-child");
				currentUserNode.find(".user_short_txt").attr("onclick","app.getUserProfile("+user.id+");");
				currentUserNode.find(".user_photo_wrap").attr("onclick","app.getUserProfile("+user.id+");");
				if(user.isNew == 1){
					currentUserNode.find(".blue_star").show();
				}
				if(user.isPaying == 1){
					currentUserNode.find(".special3").show();
				}
				if(user.isOnline == 1){
					currentUserNode.find(".on2").show();
				}
				if(user.distance != ""){
					currentUserNode.find(".distance_value").show().find("span").html(user.distance);
				}
			}
			//setTimeout(app.stopLoading(), 10000);
			//app.stopLoading();
			app.responseItemsNumber = app.response.users.itemsNumber;

			if(app.responseItemsNumber == app.itemsPerPage){
            	var loadingHTML = '<div class="loadingHTML">'+$('#loadingBarTemplate').html()+'</div>';
            	$(loadingHTML).insertAfter(currentUserNode);
            }

			app.setScrollEventHandler(2500,3500);

		}
        else{
        	app.pageNumber--;
        }
	},

/*
	setScrollEventHandler: function(){
		$(window).scroll(function(){
			var min=600;

			if($(this).width()>767)min=1250;
			app.recentScrollPos = $(this).scrollTop();
			if(app.recentScrollPos >= app.container.height()-min){
				//alert(app.recentScrollPos);
				$(this).unbind("scroll");
				if(app.responseItemsNumber == app.itemsPerPage){
					app.pageNumber++;
					app.getUsers();
				}
			}
		});
	},

*/

	setScrollEventHandler: function(min1, min2){
    		$(window).scroll(function(){
    			//var min=2500;

    			min = min1;
    			if($(this).width()>767) min = min2;


    			app.recentScrollPos = $(this).scrollTop();
    			console.log('setScrollEventHandler:' + app.recentScrollPos);
    			console.log(app.recentScrollPos + ':' + app.container.height());
    //			alert(app.recentScrollPos + ' > ' + app.container.height() +' - ' +min);



    			if(app.recentScrollPos >= app.container.height()-min){
    				$(this).unbind("scroll");

    				 //alert(app.recentScrollPos);


    				if(app.responseItemsNumber == app.itemsPerPage){

    					app.pageNumber++;

    					 if(app.currentPageId == 'messenger_page'){
    						 app.getMessenger();
    					 }
    					 else{
    						app.getUsers();
    					 }
    				}
    				//else alert(app.itemsPerPage);
    			}
    		});
    	},

	getMyProfileData: function(){
		app.startLoading();
		$("#upload_image").click(function(){
			$("#statistics").hide();
			$("#uploadDiv").css({"background":"#fff"});
			$("#uploadDiv").show();

			$('#get_stat_div').show();
			$('#upload_image_div').hide();
		});
		$("#get_stat").click(function(){
			$("#statistics").show();
			$("#uploadDiv").hide();

			$('#get_stat_div').hide();
			$('#upload_image_div').show();
		});
		var userId = window.localStorage.getItem("userId");
		$.ajax({
			url: app.apiUrl + '/api/v4/user/profile/'+userId,
			success: function(user, status, xhr){
				//alert(JSON.stringify(user));
				app.showPage('my_profile_page');
				app.container = app.currentPageWrapper.find('.myProfileWrap');
				app.container.find('.txt strong').html(user.nickName+', <span>'+user.age+'</span>');
				app.container.find('.txt strong').siblings('span').text(user.city);
				app.container.find('.txt div').html(user.about);
				app.container.find('.user_pic img').attr("src",user.mainImage.url);
				if(user.isPaying && user.userGender == 1){
					app.container.find(".special4").show();
				}
				//console.log(JSON.stringify(user));
				//return;
				var addedToFriends = user.statistics.fav;
				var contactedMe = user.statistics.contactedme;
				var contacted = user.statistics.contacted;
				var addedToBlackList = user.statistics.black;
				var addedYouToFriends = user.statistics.favedme;
				var lookedMe = user.statistics.lookedme;
				var looked = user.statistics.looked;
				app.container.find(".stat_side").eq(1).find(".items_wrap").eq(0).find(".stat_value").text(addedToFriends);
				app.container.find(".stat_side").eq(0).find(".items_wrap").eq(1).find(".stat_value").text(contactedMe);
				app.container.find(".stat_side").eq(1).find(".items_wrap").eq(2).find(".stat_value").text(contacted);
				app.container.find(".stat_side").eq(1).find(".items_wrap").eq(1).find(".stat_value").text(addedToBlackList);
				app.container.find(".stat_side").eq(0).find(".items_wrap").eq(0).find(".stat_value").text(addedYouToFriends);
				app.container.find(".stat_side").eq(0).find(".items_wrap").eq(2).find(".stat_value").text(looked);
				app.container.find(".stat_side").eq(1).find(".items_wrap").eq(3).find(".stat_value").text(lookedMe);
				app.stopLoading();
			}
		});
	},

	getStatUsers: function(statAction){
		app.showPage('users_list_page');
		app.currentPageWrapper.find('.content_wrap').html('');
		app.template = $('#userDataTemplate').html();
		app.container = app.currentPageWrapper.find('.content_wrap');
		app.container.append('<h1>תוצאות</h1><div class="dots"></div>');
		app.pageNumber = 1;
		app.action = 'getStatResults';
		app.statAction = statAction;
		app.getUsers();
	},

	recovery: function(){
		app.showPage('recovery_page');
		app.currentPageWrapper.find('#user').val('');
	},

	sendRecovery: function(){
		var mail = app.currentPageWrapper.find('#user').val();
		var email_pattern = new RegExp(/^[+a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/i);
        if (!(email_pattern.test(mail))) {
            alert('נא להזין כתובת דוא"ל חוקית');
            return false;
        }
        $.ajax({
        	url: app.apiUrl + '/api/v4/recovery/'+mail,
        	success: function(response){
        		//alert(JSON.stringify(response));
        		if(!response.err)
        			app.currentPageWrapper.find('#user').val('');
        		alert(response.text);
        	},
        	error: function(err){
        		app.currentPageWrapper.find('#user').val('');
				alert('סיסמה נשלחה לכתובת המייל שהזנת');
			}
        });
	},

	getSearchForm: function(){
		app.startLoading();
		app.showPage('search_form_page');
		app.getRegions();
		app.searchFuncsMainCall = true;
		//app.getSexPreference();
		//$("#regions_wrap").hide();
		//app.getCountries();
		var html = '<select>';
		for(var i = 18; i <= 80; i++){
			html = html + '<option value="' + i + '"">' + i + '</option>';
		}
		html = html + '</select>';

		$(".age_1").html(html);
		$(".age_1").trigger("create");

		var html = '<select>';
		var sel = '';
		for(var i = 19; i <= 80; i++){
			if(i == 40) sel = ' selected="selected"';
			else sel = '';
			html = html + '<option value="' + i + '"' + sel + '>' + i + '</option>';
		}
		html = html + '</select>';
		$(".age_2").html(html);
		$(".age_2").trigger("create");
		app.stopLoading();
	},

/*	getSexPreference: function(){
		$.ajax({
			url: app.apiUrl + '/api/v4/list/sexPreference',
			success: function(list, status, xhr){
				var html = '';
				if(app.currentPageId == 'register_page'){
					for(var i in list.items){
						var item = list.items[i];
						html = html + '<option value="' + item.sexPrefId + '">' + item.sexPrefName + '</option>';
					}
					$(".sexPreferenceList").html(html);
					$(".sexPreferenceList").val($(".sexPreferenceList").val());
					$(".sexPreferenceList").find("option[value='1']").insertBefore($(".sexPreferenceList").find("option:eq(0)"));
					$(".sexPreferenceList").val($(".sexPreferenceList").find("option:first").val()).selectmenu("refresh");
				}else if(app.currentPageId == 'search_form_page'){
					for(var i in list.items){
						var item = list.items[i];
						html = html + '<input type="checkbox" id="check-sex' + item.itemId  + '" value="' + item.itemId  + '"><label for="check-sex' + item.itemId  + '">' + item.itemName + '</label>';
					}
					$(".sexPreferenceList fieldset").html(html);
					$(".sexPreferenceList").trigger("create");
				}

			}

		});
	},*/

	injectCountries: function(html, container){
		container.html(html);
		container.trigger('create');
		container.find("option[value='US']").insertBefore(container.find("option:eq(0)"));
		container.find("option[value='CA']").insertBefore(container.find("option:eq(1)"));
		container.find("option[value='AU']").insertBefore(container.find("option:eq(2)"));
		container.find("option[value='GB']").insertBefore(container.find("option:eq(3)"));
		container.val(container.find("option:first").val()).selectmenu("refresh");
	},



	getRegions: function(){
    		$.ajax({
    			url: app.apiUrl + '/api/v4/list/regions',
    			success: function(list, status, xhr){
    				var html = '<select name="regionCode">';
    				if(app.currentPageId == 'search_form_page'){
    					html = html + '<option value="">לא חשוב</option>';
    				}
    				else if(app.currentPageId == 'register_page'){
    				    html = html + '<option value="">בחרו</option>';
    				}



    				app.container.find(".regionsList").html('');
    				//app.container.find("#cities_wrap").hide();
    				//app.container.find(".citiesList").html('');
    				if(list.itemsNumber > 0){
    					for(var i in list.items){
    						var item = list.items[i];
    						html = html + '<option value="' + item.itemId + '">' + item.itemName + '</option>';
    					}
    					html = html + '</select>';
    					app.container.find(".regionsList").html(html).trigger('create');
    					//app.container.find("#regions_wrap").show();
    					/*
    					if(app.currentPageId == 'register_page'){
    						app.container.find('.regionsList select').change(function(){
    							app.getCities(app.container.find("#countries_list").val(),$(this).val());
    						});
    					}
    					*/
    				}
    				else{
    					var html = '<input type="text" name="cityName" id="cityName" />';
    					app.container.find(".citiesList").html(html);
    					app.container.find("#cities_wrap").show();
    				}

    			}
    		});
    },
	/*
	getCities: function(countryCode,regionCode){
		$.ajax({
			url: 'http://m.shedate.co.il/api/v4/list/cities/'+countryCode+'/'+regionCode,
			success: function(list, status, xhr){
				app.container.find("#cities_wrap").hide();
				if(list.itemsNumber > 0){
					var html = '<select name="cityName">';
					for(var i in list.items){
						var item = list.items[i];
						html = html + '<option value="' + item.cityName + '">' + item.cityName + '</option>';
					}
					html = html + '</select>';
					app.container.find(".citiesList").html(html).trigger('create');
					app.container.find("#cities_wrap").show();
				}
				else{
					if(countryCode != 'US'){
						var html = '<input type="text" name="cityName" id="cityName" />';
						app.container.find(".citiesList").html(html);
						app.container.find("#cities_wrap").show();
					}
				}
			}
		});
	},
	*/

	sendRegData: function(){
		if(app.formIsValid()){
			app.startLoading();
			var data = JSON.stringify(
				$('#regForm').serializeObject()
			);
			//alert(	data);
			$.ajax({
				url: app.apiUrl + '/api/v4/user1',
				type: 'Post',
				data: data,
				success: function(response){
					app.response = response;
					//alert( JSON.stringify(app.response));
					if(app.response.result > 0){
						var userInput = app.container.find("#userEmail").val();
						var pass = app.container.find("#userPass").val();
						user = unescape(encodeURIComponent(userInput));
						pass = unescape(encodeURIComponent(pass));
						window.localStorage.setItem("user",user);
						window.localStorage.setItem("pass",pass);
						window.localStorage.setItem("userId", app.response.result);
						window.localStorage.setItem("userInput", userInput);
						app.ajaxSetup();
						app.response = response;
						app.getRegStep(data);
					}
					else{
						app.alert(response.err);
					}

					app.stopLoading();
				}
			});


		}

	},

	getRegStep: function(data){
    	//$('#test_test_page').show();
    	app.showPage('upload_image_page');
    	app.container.find('.regInfo').text('אתם רשאים כעת להעלות תמונה בפורמט JPEG לפרופיל שלכם');  // Also you may upload an image in your profile now.

        if(typeof app.response.text != 'undefined' && app.response.text != '')
            app.currentPageWrapper.find('.myImagesText').first().html(app.response.text).show();
        else
            app.currentPageWrapper.find('.myImagesText').html('').hide();

    	if(data){
    		object = JSON.parse(data);

    		if(object.userGender == 1){
    			if(typeof app.response.text !== 'undefined'){
    				//app.container.find('.regInfo').prepend(app.response.text); /* '. חשבונך טרם הופעל. אנא בדוק את הדוא"ל שלך לצורך הפעלת החשבון.' */
    			}
    			if(typeof app.response.url !== 'undefined'){
    				//window.open(app.response.url, '_blank', 'location=yes');
    				app.container.find('.continue').attr("onclick", app.response.url)
    			}
    		}
    	}

    	window.scrollTo(0,0);
    },

	formIsValid: function(){
    		var email_pattern = new RegExp(/^[+a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/i);
    		if (!(email_pattern.test($('#userEmail').val()))) {
    			alert('דוא"ל שגוי');
    			$('#userEmail').focus();
    			return false;
    		}
    		/*if ($('#userEmail').val() != $('#userEmail2').val()) {
    			alert("Error in retyped email");
    			$('#userEmail2').focus();
    			return false;
    		}*/
    		if ($('#userPass').val().length < 4 || $('#userPass').val().length > 12) {
    			alert("סיסמה שגויה (אמור להיות 4-12 סימנים)");
    			$('#userPass').focus();
    			return false;
    		}
    		if ($('#userPass').val() != $('#userPass2').val()) {
    			alert("טעות בסיסמה שנית");
    			$('#userPass2').focus();
    			return false;
    		}
    		if (app.container.find('#userNick').val().length < 3) {
    			alert('כינוי שגוי (אמור להיות 3 סימנים לפחות)');
    			//$('#userNic').focus();
    			return false;
    		}
    		if($('#d').val().length == 0 || $('#m').val().length == 0 || $('#y').val().length == 0){
    			alert('תאריך לידה שגוי');
    			return false;
    		}




    		if (!app.container.find('.heightList select').val().length) {
    			app.alert('גובה שגוי');
    			return false;
    		}

    		if (!app.container.find('.bodyTypeList select').val().length) {
    			app.alert('מבנה גוף שגוי');
    			return false;
    		}

    		if (!app.container.find('.eyesColorList select').val().length) {
    			app.alert('צבע עיניים שגוי');
    			return false;
    		}

    		if (!app.container.find('.hairColorList select').val().length) {
    			app.alert('צבע השער שגוי');
    			return false;
    		}

    		if (!app.container.find('.hairLengthList select').val().length) {
    			app.alert('תסרוקת שגויה');
    			return false;
    		}

    		if(!app.container.find('.relationshipTypeList input[type="checkbox"]:checked').size()){
    			app.alert('פה למטרה שגוי');
    			return false;
    		}

    		if (!app.container.find('.economyList select').val().length) {
    			app.alert('מצב כלכלי שגוי');
    			return false;
    		}

    		if (!app.container.find('.maritalStatusList select').val().length) {
    			app.alert('מצב משפחתי שגוי');
    			return false;
    		}

    		if (!app.container.find('.childrenList select').val().length) {
    			app.alert('מספר ילדים שגוי');
    			return false;
    		}

    		if (!app.container.find('.originList select').val().length) {
    			app.alert('מוצא שגוי');
    			return false;
    		}


    		if (!app.container.find('.smokingList select').val().length) {
    			app.alert('הרגלי עישון שגויים');
    			return false;
    		}

    		if (!app.container.find('.drinkingList select').val().length) {
    			app.alert('הרגלי שתיה שגויים');
    			return false;
    		}

    		if (!app.container.find('.regionsList select').val().length) {
    			app.alert('איזור שגוי');
    			return false;
    		}

    		if(app.container.find('#userCity').val().length == 0){
    			app.alert('עיר שגויה');
    			return false;
    		}

    		var gender = $('#userGender').val();
            if(gender == 1){
				var phoneLen = app.container.find('#userPhone').val().length;
				if(phoneLen < 10){
					app.alert('טלפון קצר מדי');
					return false;
				}
				if(phoneLen > 12){
					app.alert('טלפון שגוי');
					return false;
				}
            }

    		if(app.container.find('#aboutMe').val().length < 10){
    			app.alert('על עצמי שגוי (אמור להיות 10 סימנים לפחות)');
    			return false;
    		}

    		if(app.container.find('#lookingFor').val().length < 10){
    			app.alert('מה אני מחפש/ת שגוי (אמור להיות 10 סימנים לפחות');
    			return false;
    		}

    		if(app.container.find('#confirm option:selected').val() != "1"){
    			app.alert('אנא סמנו בתיבה');
    			return false;
    		}

    		return true;
    },

	search: function(pageNumber){
		app.showPage('users_list_page');
		app.template = $('#userDataTemplate').html();
		app.container = app.currentPageWrapper.find('.content_wrap');
		app.container.html('');
		app.container.append('<h1>תוצאות</h1><div class="dots"></div>');
		app.pageNumber = 1;
		app.action = 'getSearchResults';
		app.getUsers();
	},

	reportAbuse: function(){

    	var abuseMessage = $('#abuseMessage').val();

    	$.ajax({
    	   url: app.apiUrl+'/api/v4/user/abuse/'+app.reportAbuseUserId,
    	   type: 'Post',
    	   contentType: "application/json; charset=utf-8",
    	   data: JSON.stringify({abuseMessage: abuseMessage}),
    	   error: function(response){
    		   //alert(JSON.stringify(response));
    	   },
    	   success: function(response, status, xhr){
    		   $('#abuseMessage').val('');
    		   app.alert('תודה. ההודעה נשלחה.');
    		   app.back();
    	   }
       	});
    },


	sendMessageToAdmin: function(){

		app.startLoading();

		var userId = window.localStorage.getItem("userId");
		var messageToAdmin = $('#messageToAdmin').val();

		if(!messageToAdmin.length){
			return;
		}

		$.ajax({
		   	url: app.apiUrl + '/api/v4/contactUs',
		   	type: 'Post',
		   	contentType: "application/json; charset=utf-8",
		   	data: JSON.stringify({
				userId: userId,
				messageToAdmin: messageToAdmin,
			}),
			error: function(error){
			   alert(JSON.stringify(error));
			   app.stopLoading();
			},
			success: function(response, status, xhr){
			   app.stopLoading();
			   $('#messageToAdmin').val('');
			   app.alert('תודה. ההודעה נשלחה');
			   app.back();
			}
	   });
	},

	addToFavorites: function(userId){
    	$.ajax({
            url: app.apiUrl+'/api/v4/user/favorites/' + userId,
            type: 'Post',
            contentType: "application/json; charset=utf-8",
            error: function(response){
       			//alert(JSON.stringify(response));
    		},
            success: function(response, status, xhr){
            	if(response.success){
            		app.alert('משתמש הוסף למועדפים');
            	}
            	else{
            		app.alert('משתמש כבר קיים במועדפים');
            	}

            	}
        });
    },

	addToBlackList: function(userId){
    	$.ajax({
            url: app.apiUrl+'/api/v4/user/blacklist/' + userId,
            type: 'Post',
            contentType: "application/json; charset=utf-8",
            error: function(response){
       			//alert(JSON.stringify(response));
    		},
            success: function(response, status, xhr){

            	//alert(JSON.stringify(response));
            	//return;

            	if(response.success){
            		app.alert('משתמש הוסף לרשימה שחורה');
            	}
            	else{
            		app.alert('משתמש כבר קיים ברשימה שחורה');
            	}
            }
        });
    },

    manageLists: function(list, act, userId){
    		app.startLoading();
    		//alert(app.apiUrl+'/api/v4/user/managelists/'+ list + '/' + act + '/' + userId);
        	$.ajax({
                url: app.apiUrl+'/api/v4/user/managelists/'+ list + '/' + act + '/' + userId,
                type: 'Post',
                contentType: "application/json; charset=utf-8",
                error: function(response){
           			alert(JSON.stringify(response));
        		},
                success: function(response, status, xhr){

                	//alert(JSON.stringify(response));
                	//return;

                	if(response.success){
                        app.alert(response.success);
                        app.container.find('.' + list + act).hide();
                        if(act == '1'){
                        	app.container.find('.' + list + '0').show();
                        }else{
                        	app.container.find('.' + list + '1').show();
                        }
                    }
                    app.stopLoading();
                }
            });
        },


	getUserProfile: function(userId){
		if(userId==window.localStorage.getItem("userId")){app.getMyProfileData(); return;}

		if(getUsersRequest != ''){
        	getUsersRequest.abort();
        	console.log("Abort getUsersRequest");
        	app.pageNumber--;
        }

		app.ajaxSetup();
		app.startLoading();

		$.ajax({
			url: app.apiUrl + '/api/v4/user/profile/'+userId,
			type: 'Get',
			success: function(user, status, xhr){
				//alert( JSON.stringify(user));
				app.reportAbuseUserId = userId;
                $('.my-gallery').html('');
				app.showPage('user_profile_page');
				window.scrollTo(0, 0);

				var detailsContainer = app.container.find('#user_details');
				app.container.find(".special3, .blue_star, .on5, .pic_wrap").hide();

				/*
				app.container.find('.pic_wrap').addClass("left").removeClass("center");
				app.container.find('#pic1').parent('a').addClass("fancybox");
				*/

				app.container.find("h1 span").text(user.nickName);

				/*
				app.container.find('#pic1').attr("src",user.mainImage.url).parent('a').attr({"href":user.mainImage.url, "rel":"images_"+user.userId});
				if(user.mainImage.url == "http://m.shedate.co.il/images/no_photo_female.jpg"
				|| user.mainImage.url == "http://m.shedate.co.il/images/no_photo_male.jpg"){
					app.container.find('#pic1').parent('a').removeClass("fancybox").attr("href","#");
				}
				app.container.find('.pic_wrap').eq(0).show();
				app.container.find('.fancybox').fancybox();
				if(typeof user.otherImages[0] !== "undefined"){
					//alert(user.otherImages[0]);
					app.container
						.find('.pic_wrap').eq(1).show()
						.find("img").attr("src",user.otherImages[0])
						.parent('a')
						.attr({"href":user.otherImages[0], "rel":"images_"+user.userId});
				}else{
					app.container.find('.pic_wrap').eq(0).addClass("center").removeClass("left");
				}
				if(typeof user.otherImages[1] !== "undefined"){
					//alert(user.otherImages[1]);
					app.container.find('.pic_wrap').eq(2).show()
						.find("img").attr("src",user.otherImages[1])
						.parent('a').attr({"href":user.otherImages[1], "rel":"images_"+user.userId});
				}
				*/


				if(user.mainImage.size.length >= 3){
                   	$('.noPicture').hide();
					var userPhotoTemplate = $('#userPhotoTemplate').html().replace(/\[ID\]/g,'pic1');
                	$(userPhotoTemplate).appendTo('.my-gallery');
                	app.container.find('#pic1').attr("src",user.mainImage.url).parent('a').attr({"href":user.mainImage.url, "data-size": user.mainImage.size});
                	app.container.find('.pic_wrap').eq(0).show();
                }
                else{
                	$('.noPicture img').attr("src",user.mainImage.url);
                	$('.noPicture').show();
                }


                if(typeof user.otherImages[0] !== "undefined"){
                	app.proccessUserPhotoHtml(user,1);

                }else{
                	app.container.find('.pic_wrap').addClass("center");
                }

                if(typeof user.otherImages[1] !== "undefined"){
                	app.proccessUserPhotoHtml(user,2);
                }


                initPhotoSwipeFromDOM('.my-gallery');


				if(user.isPaying == 1){
					app.container.find(".special3").show();
				}
				if(user.isNew == 1){
					app.container.find(".blue_star").show();
				}
				if(user.isOnline == 1){
					app.container.find(".on5").show();
				}
				if(user.distance != ""){
					app.container.find(".distance_value").show().css({'right':($('#user_pictures .pic_wrap').width()*0.9-$('#user_pictures .distance_value').width())/2+'px'}).find("span").html(user.distance);
				}else{
					app.container.find(".distance_value").hide().find("span").html(user.distance);
				}



								app.profileGroupTemplate = $('#userProfileGroupTemplate').html();
                				app.profileLineTemplate = $('#userProfileLineTemplate').html();
                				app.profileLineTemplate2 = $('#userProfileLineTemplate2').html();

/*
                				var profileButtonsTemplate = $('#userProfileButtonsTemplate').html();
                			    var profileButtonsTemplate_2 = $('#userProfileButtonsTemplate_2').html();
                			    profileButtonsTemplate = profileButtonsTemplate.replace(/\[USERNICK\]/g,user.nickName);
                			    profileButtonsTemplate = profileButtonsTemplate.replace("[USER_ID]", user.userId);
*/
                			    if(user.userId != window.localStorage.getItem('userId')){
                				    var profileButtonsTemplate = $('#userProfileButtonsTemplate').html();
                				    var profileButtonsTemplate_2 = $('#userProfileButtonsTemplate_2').html();
                				    profileButtonsTemplate = profileButtonsTemplate.replace(/\[USERNICK\]/g,user.nickName);
                				    profileButtonsTemplate = profileButtonsTemplate.replace(/\[USER_ID\]/g, user.userId);
                				    profileButtonsTemplate_2 = profileButtonsTemplate_2.replace(/\[USER_ID\]/g, user.userId);
                				}
                			    else{
                				    var profileButtonsTemplate = '';
                				    var profileButtonsTemplate_2 = '';
                			    }


                				for(var property in user){
                					if(!user[property]){
                						//console.log(property);
                						user[property] = '';
                					}else{
                						user[property] = String(user[property]);
                					}
                				}

                				var html = profileButtonsTemplate;
                				var userDataHtml = '';

                			    userDataHtml = userDataHtml + app.getProfileLine("גובה", user.height);
                				userDataHtml = userDataHtml + app.getProfileLine("משקל", user.weight);
                				userDataHtml = userDataHtml + app.getProfileLine("צבע עיניים", user.eyesColor);
                				userDataHtml = userDataHtml + app.getProfileLine("מבנה גוף", user.bodyType);
                				userDataHtml = userDataHtml + app.getProfileLine("צבע שיער", user.hairColor);
                				userDataHtml = userDataHtml + app.getProfileLine("תסרוקת", user.hairLength);
                				userDataHtml = userDataHtml + app.getProfileLine("גודל חזה", user.breast);

                				if(userDataHtml.length){
                					html = html + app.getProfileGroup("מראה חיצוני") + userDataHtml;
                				}
                				var userDataHtml = '';

                			    userDataHtml = userDataHtml + app.getProfileLine("גיל", user.age);
                			    userDataHtml = userDataHtml + app.getProfileLine("אזור מגורים", user.region);
                				userDataHtml = userDataHtml + app.getProfileLine("עיר", user.city);
                				userDataHtml = userDataHtml + app.getProfileLine("מזל", user.zodiak);
                				userDataHtml = userDataHtml + app.getProfileLine("ארץ לידה", user.country);
                				userDataHtml = userDataHtml + app.getProfileLine("עישון", user.smoking);
                				userDataHtml = userDataHtml + app.getProfileLine("הרגלי שתיה", user.drinking);
                				userDataHtml = userDataHtml + app.getProfileLine("מצב משפחתי", user.maritalStatus);
                				userDataHtml = userDataHtml + app.getProfileLine("מספר ילדים", user.userChildren);
                				userDataHtml = userDataHtml + app.getProfileLine("מוצא", user.origin);
                				userDataHtml = userDataHtml + app.getProfileLine("השכלה", user.education);
                				userDataHtml = userDataHtml + app.getProfileLine("עיסוקי", user.occupation);
                				userDataHtml = userDataHtml + app.getProfileLine("מצבי הכלכלי", user.economy);

                				if(userDataHtml.length){
                					html = html + app.getProfileGroup("מידע בסיסי") + userDataHtml;
                				}
                				var userDataHtml = '';

                				if(user.about.length){
                					html = html + app.getProfileGroup("מעט עלי");
                					html = html + app.getProfileLine("", user.about);
                				}

                				if(user.lookingFor.length){
                					html = html + app.getProfileGroup("אני מחפש/ת");
                					html = html + app.getProfileLine("", user.lookingFor);
                				}

                				if(user.hobbies.length || user.music.length){
                					html = html + app.getProfileGroup("עוד קצת עלי");
                					html = html + app.getProfileLine("תחומי העניין שלי", user.hobbies);
                					html = html + app.getProfileLine("המוסיקה שלי", user.music);
                				}


                			    html = html + profileButtonsTemplate + profileButtonsTemplate_2;

                				detailsContainer.html(html).trigger('create');

                				app.container.find('.pic_wrap').click(function(){
                                	document.removeEventListener("backbutton", app.back, false);
                                	document.addEventListener("backbutton", app.closeUserGallery, false);
                                });

                                var hideFavButton = 0;
								if(user.is_in_favorite_list){
									hideFavButton = 1;
								}
								var hideBlackButton = 0;
                                if(user.is_in_black_list){
                                	hideBlackButton = 1;
                                }
                                detailsContainer.find('.favi'  + hideFavButton).hide();
								detailsContainer.find('.black'  + hideBlackButton).hide();

								app.stopLoading();
			}
		});
	},

	closeUserGallery: function(){
    	$('.pswp__button--close').click();
    },

	proccessUserPhotoHtml: function(user,index){

    	var userPhotoTemplate = $('#userPhotoTemplate').html().replace(/\[ID\]/g,'pic' + index + 1);
    	$(userPhotoTemplate).appendTo('.my-gallery');

    	var imageSize = (user.otherImages[index-1].size.length >= 3) ? user.otherImages[index-1].size : '1x1' ;

    	console.log("SIZE of " + user.otherImages[index-1].url + ":" + imageSize);

    	app.container
    		.find('.pic_wrap')
    		.css({"float": "left"})
    		.eq(index)
    		.show()
    		.find('img')
    		.show()
    		.attr("src",user.otherImages[index-1].url)
    		.parent('a')
    		.attr({"href": user.otherImages[index-1].url, "data-size": imageSize});
    },


	getProfileGroup: function(groupName){
		var group = app.profileGroupTemplate;
		return group.replace("[GROUP_NAME]", groupName);
	},

	getProfileLine: function(lineName, lineValue){
		if(lineName != ""){
			var line = app.profileLineTemplate;
			line = line.replace("[LINE_NAME]", lineName);
		}
		else{
			var line = app.profileLineTemplate2;
		}
		line = line.replace("[LINE_VALUE]", lineValue);
		return line;
	},

	getMessenger: function(){

		if(app.pageNumber == 1){
			window.scrollTo(0, 0);
        	app.startLoading();
        }

        app.itemsPerPage = 20;

		$.ajax({
			url: app.apiUrl + '/api/v4/user/contacts/perPage:' + app.itemsPerPage + '/page:' + app.pageNumber,
			complete: function(event, xhr, settings){
				//console.log("ERR: " + JSON.stringify(event + xhr + settings));
			},
			error: function(response){
				console.log("ERR: " + JSON.stringify(response));
			},
			success: function(response){
   				console.log(JSON.stringify(response));

				app.response = response;
				//if(pagesTracker.indexOf('messenger_page')!=-1){
				//	pagesTracker.splice(pagesTracker.length-pagesTracker.indexOf('messenger_page'),pagesTracker.indexOf('messenger_page'));
				//}
				app.showPage('messenger_page');


			   app.container = app.currentPageWrapper.find('.chats_wrap');
			   if(app.pageNumber == 1){
			        app.container.html('');
			   }

			   if(app.currentPageId == 'messenger_page'){

			       	$('.loadingHTML').remove();

			       	app.responseItemsNumber = app.response.chatsNumber;

     			   	if(app.responseItemsNumber == 0){
			           app.container.append('<div class="center noResults">אין הודעות</div>')
			           return;
			       	}


					app.template = $('#messengerTemplate').html();
					for(var i in app.response.allChats){
						var currentTemplate = app.template;
						var chat = app.response.allChats[i];
						currentTemplate = currentTemplate.replace("[IMAGE]",chat.user.mainImage.url);
						currentTemplate = currentTemplate.replace(/\[USERNICK\]/g,chat.user.nickName);
						currentTemplate = currentTemplate.replace("[RECENT_MESSAGE]",chat.recentMessage.text);
						currentTemplate = currentTemplate.replace("[DATE]", chat.recentMessage.date);
						currentTemplate = currentTemplate.replace("[USER_ID]", chat.user.userId);
						app.container.append(currentTemplate);
						if(chat.newMessagesCount > 0 || chat. user.isPaying == 1){
							var currentUserNode = app.container.find(":last-child");
							if(chat.newMessagesCount > 0)
								currentUserNode.find(".new_mes_count").html(chat.newMessagesCount).show();

							if(chat.user.isPaying == 1)
								currentUserNode.find(".special2").show();
						}
					}



					if(app.responseItemsNumber == app.itemsPerPage){

						var loadingHTML = '<div class="loadingHTML mar_top_8">'+$('#loadingBarTemplate').html()+'</div>';
						$(loadingHTML).insertAfter(app.container.find('.mail_section:last-child'));

						//app.startLoading();
					}

				   //else{alert(app.responseItemsNumber +' '+app.itemsPerPage)}

					app.setScrollEventHandler(1000, 2000);


			   }
			   else{
			       app.pageNumber--;
			   }

				app.stopLoading();
			}
		});
	},

	getChat: function(chatWith, userNick){
		if(chatWith===window.localStorage.getItem("userId")){app.getMyProfileData(); return;}
		app.chatWith = chatWith;
		app.startLoading();
		$.ajax({
			url: app.apiUrl + '/api/v4/user/chat/'+app.chatWith,
			success: function(response){
				//app.response = response;
				app.contactCurrentReadMessagesNumber = response.contactCurrentReadMessagesNumber;
				//alert(JSON.stringify(app.response));
				app.showPage('chat_page');
				window.scrollTo(0, 0);
				app.container = app.currentPageWrapper.find('.chat_wrap');
				app.container.html('');
				app.template = $('#chatMessageTemplate').html();
				app.currentPageWrapper.find('.content_wrap').find("h1 span").text(userNick).attr('onclick','app.getUserProfile(\''+chatWith+'\')');
				var html = app.buildChat(response);
				//app.container.html(html);
				$('.chat_wrap').html(html);
				app.subscribtionButtonHandler(response);
				app.refreshChat();
				app.stopLoading();
			}
		});
	},

	subscribtionButtonHandler: function(response){
		if(response.chat.abilityReadingMessages == 0){
			app.container.find('.message_in .buySubscr').show().trigger('create');
		}
	},

	buildChat: function(response){
		var html = '';
		var k = 1;
		var appendToMessage = '';

		for(var i in response.chat.items){
			var currentTemplate = app.template;
			//console.log(currentTemplate);
			var message = response.chat.items[i];

			if(app.chatWith == message.from){
            	message.text = message.text + appendToMessage;
            	var messageType = "message_in";
            	var messageFloat = "left";
            	var messageStatusVisibility = 'hidden';
            	var messageStatusImage = '';
            	var info = "info_left";
            	//var isRead = "";
            }
            else {
            	var messageType = "message_out";
            	var messageFloat = "right";
            	var info = "info_right";
            	var messageStatusVisibility = '';
            	var messageStatusImage = (message.isRead == 1) ? 'messageRead.jpg' : 'messageSaved.jpg';
            	//console.log(message.isRead);
            	//var isRead = (message.isRead == 0) ? "checked" : "double_checked";
            }

            if(message.from == '0' && message.to == '0'){
            	currentTemplate = '';
            	setTimeout(function(){app.alert(message.alert);},500);
            }

			currentTemplate = currentTemplate.replace("[MESSAGE]", message.text);
            currentTemplate = currentTemplate.replace("[DATE]", message.date);
            currentTemplate = currentTemplate.replace("[TIME]", message.time);
            currentTemplate = currentTemplate.replace("[MESSAGE_TYPE]", messageType);
          	currentTemplate = currentTemplate.replace("[MESSAGE_FLOAT]", messageFloat);
            currentTemplate = currentTemplate.replace("[MESSAGE_STATUS_VISIBILITY]", messageStatusVisibility);
            currentTemplate = currentTemplate.replace("[MESSAGE_STATUS_IMAGE]", messageStatusImage);
            currentTemplate = currentTemplate.replace("[INFO]", info);

			html = html + currentTemplate;

			console.log(html);

			//var from = message.from;

			//k++;
		}

		return html;
	},

	sendMessage: function(){
		var message = $('#message').val();
		//alert(message);
		if(message.length > 0){
			$('#message').val('');
			$.ajax({
				url: app.apiUrl + '/api/v4/user/chat/'+app.chatWith,
				type: 'Post',
				contentType: "application/json; charset=utf-8",
				data: JSON.stringify({
					message: message
				}),
				success: function(response){
					//alert(JSON.stringify(response));
					//app.response = response;
					if(app.currentPageId == 'chat_page'){
						var html = app.buildChat(response);
						//app.container.html(html);
						$('.chat_wrap').html(html);
						app.subscribtionButtonHandler(response);
						app.refreshChat();

						if(typeof response.error != 'undefined' && response.error != '' && response.error != 'null'){
							app.alert(response.error);
						}
					}
				},
				error: function(response){
					//alert(JSON.stringify(response));
				}
			});

		}
	},


	refreshChat: function(){

		if(refreshChat != ""){
			refreshChat.abort();
		}

		if(app.currentPageId == 'chat_page'){
			refreshChat = $.ajax({
				url: app.apiUrl + '/api/v4/user/chat/'+app.chatWith+'/'+app.contactCurrentReadMessagesNumber+'/refresh',
				type: 'Get',
				complete: function(response, status, jqXHR){
					//app.stopLoading();
				},
				success: function(response){
					if(app.currentPageId == 'chat_page'){
						//app.response = response;
						app.contactCurrentReadMessagesNumber = response.contactCurrentReadMessagesNumber;

						if(response.chat != false){

							var html = app.buildChat(response);

							if(app.currentPageId == 'chat_page') {

								if (html != '') {
									console.log("RESPONSE HTML ::" + html);
									$('.chat_wrap').html(html);
								}
								app.subscribtionButtonHandler(response);
							}
						}
					}

					setTimeout(app.refreshChat, 300);

				}
			});
		}
		else{
			refreshChat.abort();
		}

	},

	checkNewMessages: function(){

    	var user = window.localStorage.getItem("user");
    	var pass = window.localStorage.getItem("pass");

    	if(user != '' && pass != '' && app.currentPageId != 'login_page' && app.currentPageId != 'register_page' && app.currentPageId != 'recovery_page' && app.currentPageId != 'payment_page'){

    		checkNewMessagesRequest = $.ajax({
    			url: app.apiUrl + '/api/v4/user/newMessagesCount',
    			type: 'Get',
    			complete: function(response, status, jqXHR){
    				//app.stopLoading();
    			},
    			success: function(response){
    				//alert(response);
    				//app.response = response;
    				//alert(app.response.newMessagesCount);
    				if(response.newMessagesCount > 0 && app.logged !== 'nopay'){
    					var count = response.newMessagesCount;
    					//var width = $(document).width();
    					//var pos = width/2 - 30;
    					$('.new_mes_count2').html(count);
    					$('#main_page').css({'padding-top':'25px'});
    					if(app.logged === true && app.currentPageId != 'login_page' && app.currentPageId != 'register_page' && app.currentPageId != 'recovery_page' && app.currentPageId != 'payment_page')
    						$('.new_mes').show();
    					else
    						$('.new_mes').hide();
    				}
    				else{
    					$('.new_mes').hide();
    					$('#main_page').css({'padding-top':'0px'});
    				}

    				if(response.newNotificationsCount > 0){
                    	app.newNotificationsCount = response.newNotificationsCount;
						if(app.currentPageId != 'login_page' && app.currentPageId != 'register_page' && app.currentPageId != 'recovery_page' && app.currentPageId != 'payment_page'){
                    		$('#likesCount').html(app.newNotificationsCount).show();
						}else{
						    $('#likesCount').hide();
						}
                    }
                    else{
                    	app.newNotificationsCount = 0;
                    	$('#likesCount').hide();
                    	//$('#likesCount').html(app.newNotificationsCount).show();
                    }
                    if(app.logged === 'nopay'){
                        $('#likesNotifications').hide();
                    }else{
                        $('#likesNotifications').show();
                    }
    				newMessages = setTimeout(app.checkNewMessages, 10000);
    			}
    		});

    	}

    },

    getPayment: function(url){
        //var userId = window.localStorage.getItem("userId");
        //alert(userId);
        //window.open = cordova.InAppBrowser.open;
        //_self _system _blank
        ref = cordova.InAppBrowser.open(url, '_system', 'location=no');
        /*ref.addEventListener('loadstop', function() {
            ref.executeScript({
                code: "var newItem = document.createElement('div'); newItem.style.cssText = 'height:50px width:100%; background: url(../../../images/header_bg.png) repeat-x; text-align:center;'; var textnode = document.createTextNode('title'); newItem.app var bButt = document.createElement('IMG'); bButt.src='../../../images/logo.png'; bButt.style.cssText = 'border:none;height:50px;float:left;'; newItem.appendChild(bButt); var list = document.querySelector('body'); list.insertBefore(newItem, list.childNodes[0]);"
            });
            //ref.insertCSS({code: '#wrapper{padding-top:50px;background-image: url(../../../images/logo.png); background-repeat:no-repeat; background-position:top center; width:90%;}#logo img{display:none !important;}#logo {width:180px !important;height:50px !important;background: url("http://m.richdate.co.il/images/logo.png") no-repeat top left !important;}#header { background: url("http://m.gobaby.co.il/images/header_bg.png") repeat-x !important; height: 0px !important; border: 0px !important;}'});
        });
        */
        ref.addEventListener('exit', app.chooseMainPage);
    },

	getSubscription: function(){
		//var userId = window.localStorage.getItem("userId");
		/*
		//alert(userId);
		ref = window.open(app.apiUrl + '/subscription/?userId='+userId+'&app=1', '_blank', 'location=yes');
		ref.addEventListener('exit', app.chooseMainPage);
        */
        //alert(JSON.stringify(app.response));
        //$('#likesNotifications').hide();
        var template = $('#userPaymentTemplate').html();
        var response = app.response.subs;
        app.showPage('payment_page');
        $('#likesNotifications').hide();
        //alert($('#likesNotifications').attr('style'));
        $('#payment_page h1').html(response.title);
        $('#payment_page .paymentTextBefore').html(response.textBefore);
        $('#payment_page .paymentTextAfter').html(response.textAfter);
        $('#payment_page #payments').html('');
        for(var i in response.payments){
            var payment = response.payments[i];
            var curentTemplate = template;
            //payment.url = payment.url.replace("[USERID]", userId);
            curentTemplate = curentTemplate.replace("[URL]", payment.url);
            curentTemplate = curentTemplate.replace("[TITLE]", payment.title);
            curentTemplate = curentTemplate.replace("[TEXT]", payment.text);
            curentTemplate = curentTemplate.replace("[PRICE]", payment.price);
            curentTemplate = curentTemplate.replace("[SALE]", payment.sale);
            $('#payment_page #payments').append(curentTemplate);
            if(!payment.sale)
                $('#payment_page #payments .prec').last().remove();
        }
        //clearTimeout(checkStatus);
        //checkStatus = setTimeout(app.chooseMainPage(), 10000);
		//app.showPage('subscription_page');
		//$(".subscr_quest").unbind('click');
		//$(".subscr_quest").click(function(){
		//	$(this).siblings(".subscr_text").slideToggle("slow");
		//	var span = $(this).find("span");
		//	if(span.text() == '+')
		//		span.text('-');
		//	else
		//		span.text('+');
		//});

		//$('input[type="radio"]').removeAttr("checked");

		//$(".subscr").click(function(){
		//	$(".subscr_left").removeClass("subscr_sel");
		//	$(this).find("input").attr("checked","checked");
		//	$(this).find(".subscr_left").addClass("subscr_sel");
		//	setTimeout(function(){
		//		var product_id = $(".subscr_ch:checked").val();
		//		var nickName = '';
		//		window.location.href = 'https://www.2checkout.com/2co/buyer/purchase?sid=1400004&quantity=1&product_id='+product_id+'&userid='+app.userId+'&usernick='+nickName;
		//	},100);
		//});
	},

	confirmDeleteImage: function(imageId){
		app.imageId = imageId;
		navigator.notification.confirm(
				'Delete this image?',  // message
		        app.deleteImageChoice,              // callback to invoke with index of button pressed
		        'Confirmation',            // title
		        'Confirm,Cancel'          // buttonLabels
		 );
	},

	deleteImageChoice: function(buttonPressedIndex){
		if(buttonPressedIndex == 1){
			app.deleteImage();
		}
	},

	deleteImage: function(){
		app.requestUrl = app.apiUrl + '/api/v4/user/images/delete/' + app.imageId,
		app.requestMethod = 'Post';
		app.getUserImages();
	},

	displayUserImages: function(){
		app.requestUrl = app.apiUrl + '/api/v4/user/images';
		app.requestMethod = 'Get';
		app.getUserImages();
	},

	getUserImages: function(){
		$('.imagesButtonsWrap').hide();
		$.ajax({
			url: app.requestUrl,
			type: app.requestMethod,
			success: function(response){

				app.response = response;
				app.showPage('delete_images_page');
				app.container = app.currentPageWrapper.find('.imagesListWrap');
				app.container.html('');
				app.template = $('#editImageTemplate').html();
				if(typeof app.response.text != 'undefined' && app.response.text != '')
                	//app.currentPageWrapper.find('.myImagesText').text(app.response.text).show();
                	app.currentPageWrapper.find('.myImagesText').first().html(app.response.text).show();
                else
                	app.currentPageWrapper.find('.myImagesText').html('').hide();
				window.scrollTo(0,0);

				//alert(JSON.stringify(app.response));
				if(app.response.images.itemsNumber < 4)
					$('.imagesButtonsWrap').show();

				for(var i in app.response.images.items){
					var currentTemplate = app.template;
					var image = app.response.images.items[i];
					currentTemplate = currentTemplate.replace("[IMAGE]", image.url);
					currentTemplate = currentTemplate.replace("[IMAGE_ID]", image.id);
					app.container.append(currentTemplate);
					var currentImageNode = app.container.find('.userImageWrap:last-child');

					if(image.isValid == 1)
						currentImageNode.find('.imageStatus').html("אושר").css({"color":"green"});
					else
						currentImageNode.find('.imageStatus').html("עדיין לא אושר").css({"color":"red"});

				}

				app.container.trigger('create');
			}
		});
	},

	capturePhoto: function(sourceType, destinationType){
		// Take picture using device camera and retrieve image as base64-encoded string
		var options = {
			quality: 100,
			destinationType: app.destinationType.FILE_URI,
			sourceType: sourceType,
			encodingType: app.encodingType.JPEG,
			targetWidth: 600,
			targetHeight: 600,
			saveToPhotoAlbum: false,
			chunkedMode:true,
			correctOrientation: true
		};

		//document.removeEventListener("pause", navigator.app.exitApp, false);
		navigator.camera.getPicture(app.onPhotoDataSuccess, app.onPhotoDataFail, options);
	},


    onPhotoDataSuccess: function(imageURI) {
    	//document.addEventListener("pause", navigator.app.exitApp, false);
   		app.startLoading();
   		app.uploadPhoto(imageURI);
   	},

   	onPhotoDataFail: function() {
		//document.addEventListener("pause", navigator.app.exitApp, false);
   	},

	uploadPhoto: function(imageURI){
		var user = window.localStorage.getItem("user");
		var pass = window.localStorage.getItem("pass");
		var options = new FileUploadOptions();
        options.fileKey="file";
        options.fileName=imageURI.substr(imageURI.lastIndexOf('/')+1);
        options.mimeType="image/jpeg";
        options.headers = {"Authorization": "Basic " + btoa ( user + ":" + pass)};

        var ft = new FileTransfer();
        ft.upload(
        	imageURI,
        	encodeURI(app.apiUrl + "/api/v4/user/image"),
        	app.uploadSuccess,
        	app.uploadFailure,
	        options
	    );
	},


	uploadSuccess: function(r){
		//console.log("Code = " + r.responseCode);
        //console.log("Response = " + r.response);
        //console.log("Sent = " + r.bytesSent);

		//alert(r.response);
        //return;

		app.stopLoading();

		app.response = JSON.parse(r.response);
		if(app.response.status.code == 0){
			navigator.notification.confirm(
				app.response.status.message + '. לחץי על כפתור "נהל תמונות" על מנת למחוק תמונות',  // message
		        app.manageImagesChoice,              // callback to invoke with index of button pressed
		        'Notification',            // title
		        'נהל תמונות,ביטול'          // buttonLabels
		    );
		}else if(app.response.status.code == 1){
			app.alert(app.response.status.message);
		}

		if(app.currentPageId == 'delete_images_page'){
			app.displayUserImages();
		}

	},

	manageImagesChoice: function(buttonPressedIndex){
		if(buttonPressedIndex == 1){
			app.displayUserImages();
		}
	},


	uploadFailure: function(error){
		app.stopLoading();
		alert("התרחשה שגיאה. נסה שנית בבקשה.");
	},



	getEditProfile: function(){
    	$.ajax({
    		   url: app.apiUrl + '/api/v4/user/data',
    		   success: function(response){
    		   console.log(JSON.stringify(response));
    		   user = response.user;
    		   app.showPage('edit_profile_page');
    		   app.container = app.currentPageWrapper.find('.edit_wrap');
    		   app.container.html('');
    		   app.template = $('#userEditProfileTemplate').html();
    		   app.template = app.template.replace(/\[userNick\]/g,user.userNick);
    		   app.template = app.template.replace(/\[userPass\]/g,user.userPass);
    		   app.template = app.template.replace(/\[userEmail\]/g,user.userEmail);
    		   app.template = app.template.replace(/\[userRegion\]/g,user.userRegion);
    		   app.template = app.template.replace(/\[userCity\]/g,user.userCity);

    		   if(user.userAboutMe == null)
    					user.userAboutMe='';

    		   if(user.userLookingFor == null)
    					user.userLookingFor='';

    		   app.template = app.template.replace(/\[userAboutMe\]/g,user.userAboutMe);
    		   app.template = app.template.replace(/\[userLookingFor\]/g,user.userLookingFor);
    		   //app.template = app.template.replace(/\[userfName\]/g,user.userfName);
    		   //app.template = app.template.replace(/\[userlName\]/g,user.userlName);
    		   app.template = app.template.replace(/\[Y\]/g,user.Y);
    		   app.template = app.template.replace(/\[n\]/g,user.n);
    		   app.template = app.template.replace(/\[j\]/g,user.j);


    		   app.container.html(app.template).trigger('create');
    		   app.getRegions();
    		   $('#userBirth').html(app.getBithDate()).trigger('create');



    		   //app.container.find('.userGender').html(app.getuserGender()).trigger('create');
    		   },
    		   error: function(err){
    			console.log(JSON.stringify(err));
    		   }
    		   });
    	},





    saveProf: function (el,tag){
    	var name = '';
    	var val = '';
    	var input = $(el).parent().find(tag);
    	if(input.size()=='3'){
    		var er=false;
    		input.each(function(index){
    				   if(index!='0')val=val+'-';
    				   val=val+$(this).val();
    				   if($(this).val().length==0){
    				   alert('אנא תמאו ת. לידה');
    				   er=true;
    				   }
    				   });
    		if(er)return false;
    		name = 'userBirthday0';
    	}else{
    		name = input.attr('name');
    		val = input.val();
    	}
    	//alert(name+'='+val);//return false;
    	if(name == 'userPass'){
    		if(val.length < 5){
    			alert('סיסמה קצרה מדי');
    			return false;
    		}

    		if($('#editedUserPass2').val() !== val){
    			alert('מספר נתונים אינם תקינים: סיסמה או סיסמה שנית');
    			return false;
    		}

    	}
    	if((val.length < 3 && tag!='select') || (val.length==0 && tag=='select')){
    		alert($(el).parent().parent().prev().find('span').text()+' קצר מדי');
    		return false;
    	}
    	var email_pattern = new RegExp(/^[+a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/i);
    	if (!(email_pattern.test(val))&&name=='userEmail') {
    		alert("כתובת הדואר האלקטרוני שהזנת אינה תקינה");
    		return false;
    	}

    	if($(el).parent().find('.userFailed').length > 0&&$(el).parent().find('.userFailed').is(":visible"))
    		return false;

    	//alert(name+'='+val);


    	if(name == 'userAboutMe'){
    		if(app.container.find('#userAboutMe').val().length < 10){
    			app.alert('על עצמי שגוי (אמור להיות 10 סימנים לפחות)');
    			return false;
    		}
    	}

    	if(name == 'userLookingFor'){
    		if(app.container.find('#userLookingFor').val().length < 10){
    			app.alert('מה אני מחפש/ת שגוי (אמור להיות 10 סימנים לפחות)');
    			return false;
    		}
    	}


    	console.log("Abort checkNewMessagesRequest");
    	checkNewMessagesRequest.abort();
    	clearTimeout(newMessages);

    	app.startLoading();


    	$.ajax({
    		   url: app.apiUrl + '/api/v4/user/data',
    		   //dataType: 'json',
    		   type: 'post',
    		   data: JSON.stringify({name:name,val:val}),
    		   contentType: "application/json; charset=utf-8",
    		   success : function(res){

    		   console.log(JSON.stringify(res));


    		   checkNewMessagesRequest.abort();
    		   clearTimeout(newMessages);
    		   console.log("Abort checkNewMessagesRequest");


    		   var user = app.container.find("#userNick").val();

    		   //alert("USERNAME: " + user);
    		   //alert("PASSWORD: " + pass);
    		   user = unescape(encodeURIComponent(user));
    		   window.localStorage.setItem("user",user);
    		   if(name == 'userPass'){
    		   var pass = app.container.find("#editedUserPass").val();
    		   pass = unescape(encodeURIComponent(pass));
    		   window.localStorage.setItem("pass",pass);
    		   }

    		   app.ajaxSetup();
    		   app.checkNewMessages();

    		   app.stopLoading();
    		   //alert(JSON.stringify(res)); return false;

    		   if(res.err == '1'){
    		   //check(input.attr('id'),val);
    		   app.alert(res.text);
    		   $(el).parent().find('.input').css({'background':'red'});
    		   }else if(res.res == '1'){
    		   //alert(val);
    		   app.alert('עדכון נשמר');
    		   if(tag=='select'&&name!='userBirthday0'){
    		   val = $(el).parent().find('.ui-select span').eq(1).text();
    		   //alert(val);
    		   }
    		   //if(val=='0'&&name=='userGender')val = 'אישה';
    		   //if(val=='1'&&name=='userGender')val = 'גבר';

    		   if(name=='userBirthday0') val=val.replace(/-/g,' / ');
    		   if(name=='userPass')
    		   $(el).parent().next().find('input').val(val);
    		   else
    		   $(el).parent().next().find('div').text(val);
    		   $('.save').hide();
    		   $('.edit').show();
    		   }
    		   },
    		   error: function(err){
    		   app.stopLoading();
    		   app.alert(JSON.stringify(err));
    		   $('.save').hide();
    		   $('.edit').show();
    		   }
    		   });
    },

    editProf: function (el){
    	var name = $(el).attr('name');
    	if(name=='edit'){
    		$('.save').hide();
    		$('.edit').show();
    		//alert($('.sf_sel_wrap .edit').size());
    		$(el).parent().hide().prev().show();
    	}else{
    		$(el).parent().hide().next('.edit').show();
    	}
    },



	register: function(){
    	app.showPage('register_page');
    	$('#birthDate').html(app.getBithDate()).trigger('create');

    	app.getHeight();
    	app.getList('bodyType');
    	app.getList('eyesColor');
    	app.getList('hairColor');
    	app.getList('hairLength');
    	app.getList('relationshipType', true);
    	app.getList('economy');
    	app.getList('maritalStatus');
    	app.getList('children');
    	app.getList('origin');
    	app.getList('smoking');
    	app.getList('drinking');
    	app.getRegions();

    	$('#userGender').change(function(){
        	//console.log($(this).val());
            if($(this).val() == 1){
            	$('#activate_code_label').show();
            }
            else{
                $('#activate_code_label').hide();
            }
        });
    },


    getList: function(entity, multiple){

    	var entityContainer = [];
    	entityContainer['children'] = '.childrenList';
    	entityContainer['maritalStatus'] = '.maritalStatusList';
    	entityContainer['bodyType'] = '.bodyTypeList';
    	entityContainer['eyesColor'] = '.eyesColorList';
    	entityContainer['hairColor'] = '.hairColorList';
    	entityContainer['hairLength'] = '.hairLengthList';
    	entityContainer['smoking'] = '.smokingList';
    	entityContainer['drinking'] = '.drinkingList';
    	entityContainer['economy'] = '.economyList';
    	entityContainer['relationshipType'] = '.relationshipTypeList';
    	entityContainer['children'] = '.childrenList';
    	entityContainer['origin'] = '.originList';


    	$.ajax({
    	    url: app.apiUrl + '/api/v4/list/' + entity,
    	    success: function(list, status, xhr){
    		   //console.log(JSON.stringify(list));
    		   	var html = '';
    		   	if(multiple){
					html = '<fieldset data-role="controlgroup">';
					for(var i in list.items){
					   var item = list.items[i];
					   html = html + '<input name="' + entity + 'Id" type="checkbox" id="check-sex' + item.itemId  + '" value="' + item.itemId  + '"><label for="check-sex' + item.itemId  + '">' + item.itemName + '</label>';
					}
					html = html + '</fieldset>';
    		   	}
    		   else{
    			    html = '<select name="' + entity + 'Id" id="' + entity + 'Id"><option value="">בחרו</option>';
    			    for(var i in list.items){
    			    	var item = list.items[i];
    			    	html = html + '<option value="' + item[0]  + '">' + item[1] + '</option>';
    			    }
    			    html = html + '</select>';
    			}
    		    app.container.find(entityContainer[entity]).html(html).trigger("create");
    		    console.log(entity + 'Id');
			}
    	});
    },



    getHeight: function(){
    	var html = '';
    	html = html + '<select name="userHeight" id="userHeight"><option value="">בחרו</option>';
    	for (var i = 100; i <= 250; i++) {
    		html = html + '<option value="' + i + '">' + i + '</option>';
    	}
    	html = html + '</select>';

    	app.container.find('.heightList').html(html).trigger("create");
    },


	getBithDate: function(){
		var html;
		html = '<div class="left">';
			html = html + '<select name="userBirthday_d" id="d">';
				html = html + '<option value="">D</option>';
				for (var i = 1; i <= 31; i++) {
					html = html + '<option value="' + i + '">' + i + '</option>';
				}
			html = html + '</select>';
		html = html + '</div>';

		html = html + '<div class="left">';
			html = html + '<select name="userBirthday_m" id="m">';
				html = html + '<option value="">M</option>';
				for (var i = 1; i <= 12; i++) {
					html = html + '<option value="' + i + '">' + i + '</option>';
				}
			html = html + '</select>';
		html = html + '</div>';

		var curYear = new Date().getFullYear();

		html = html + '<div class="left">';
			html = html + '<select name="userBirthday_y" id="y">';
				html = html + '<option value="">Y</option>';
				for (var i = curYear - 18; i >=1940 ; i--) {
					html = html + '<option value="' + i + '">' + i + '</option>';
				}
			html = html + '</select>';
		html = html + '</div>';

		return html;
	},



	getUsersForLikes: function(supposedToBeLikedUserId, notifId){

		app.startLoading();

		if(!supposedToBeLikedUserId){
			supposedToBeLikedUserId = 0;
		}

		if(!notifId){
        	notifId = 0;
        }

        var url = app.apiUrl + '/api/v4/users/forLikes/' + supposedToBeLikedUserId + '/' + notifId;
        //alert(url);
        //return;


		$.ajax({
        	url: url,
        	type: 'Get',
        	timeout: 10000,
        	error: function(error){
        		//alert("ERROR:" + JSON.stringify(error));
        	},
        	success: function(response){

				if(response.userHasNoMainImage){
               		app.alert("כדי להיכנס לזירה של ריצ'דייט עליך לעדכן תמונה.");
                	app.displayUserImages();
                }

        		console.log("RESP:" + JSON.stringify(response));
                if(response.users.itemsNumber > 0){
					app.showPage('do_likes_page');
                	//console.log("NUMBER: " + response.users.itemsNumber);
                	//console.log("ITEMS: " + JSON.stringify(response));


					var wrapper = $('.swiper-wrapper');
					var userId = window.localStorage.getItem("userId");
					var html = '';
					//wrapper.html(html);
					//alert(response.users.items.length);
					for(var i in response.users.items){

						if (i < 200){

							var user = response.users.items[i];


							//console.log("USER: " + JSON.stringify(user));


							//html = html + '<div class="swiper-slide">'+i+'</div>';

							html = html + '<div class="swiper-slide"><div id="' + user.id + '" class="cont" style="background-image: url('
								+ user.imageUrl + ')"><div class="nickname" onclick="app.getUserProfile(' + user.id + ')">' + user.nickName + ', '+ user.age +'</div></div></div>';

							//if (i < 3){
								//wrapper.append(html);
								//html = '';
							//}
						//wrapper.append(html);
						}
						if (i == 200) break;
					}


                    wrapper.html(html);
                    //wrapper.append(html);
                    //console.log("SWIPER HTML: " + wrapper.html());
					app.initSwiper();
					app.showPage('do_likes_page');
                }


        	}
        });
	},


	initSwiper: function(){

		if(app.swiper != null){
			app.swiper.destroy();
		}
		var height = $(window).height() - 140;
        $('#do_likes_page').height(height);

		app.swiper = new Swiper ('.swiper-container', {
            // Optional parameters
            direction: 'horizontal',
            //initialSlide:10,
            //spaceBetween: 50,
            loop: true,
            speed: 100,
            nextButton: '.unlike.icon'

            // If we need pagination
            //pagination: '.swiper-pagination',

            // Navigation arrows
            //nextButton: '.swiper-button-next',
            //prevButton: '.swiper-button-prev',

            // And if we need scrollbar
            //scrollbar: '.swiper-scrollbar',
        });

	},


	doLike: function(){

		var userId = $('.swiper-slide-active .cont').attr("id");
		var swipeIndex = $('.swiper-slide-active').attr('data-swiper-slide-index');

		$.ajax({
        	url: app.apiUrl + '/api/v4/user/like/' + userId,
        	type: 'Post',
        	error: function(error){
        		console.log("ERROR: " + JSON.stringify(error));
        	},
        	success: function(response){
        		console.log("SUCCESS: " + JSON.stringify(response));
        		//app.swiper.slidePrev();
        		//$('#' + userId).parents('.swiper-slide').remove();
        		app.swiper.removeSlide(swipeIndex).updateSlidesSize();
        		app.checkBingo();
        	}
        });
	},

	test: function(){

	},

	getChatWith: function(){
		var chatWith = $('.swiper-slide-active .cont').attr("id");
		var userNick = $('.swiper-slide-active .cont .nickname').text();
		console.log($('.swiper-container').html());
		app.getChat(chatWith, userNick);
	},


	getLikesNotifications: function(){

		app.startLoading();

		$.ajax({
        	url: app.apiUrl + '/api/v4/user/likes/notifications',
        	type: 'Get',
        	error: function(error){
        		console.log("ERROR: " + JSON.stringify(error));
        	},
        	success: function(response){
        		//console.log("SUCCESS: " + JSON.stringify(response));
        		app.showPage('likes_notifications_page');

        		if(response.likesNotifications.itemsNumber > 0){
        		    var template = $('#likeNotificationTemplate').html();
        		  	var html = '';

        		    for(var i in response.likesNotifications.items){
        		    	var currentTemplate = template;
						var notification = response.likesNotifications.items[i];

						notification.nickName = notification.nickName.replace(/'/g, "׳");

                        var isReadClass = (notification.isRead == 1) ? 'isRead' : '';
                        var bingoClass = (notification.bingo == 1) ? 'bingo' : '';
                        var func = (notification.bingo == 1)
                        	? "app.setUserNotificationAsRead(" + notification.id + ", this);app.getChat('" +  notification.userId  + "','" + notification.nickName + "');"
                        	: "app.getUsersForLikes('" + notification.userId  + "','" + notification.id  + "')"
                        ;

						currentTemplate = currentTemplate.replace("[IMAGE]", notification.imageUrl);
                    	currentTemplate = currentTemplate.replace(/\[USERNICK\]/g,notification.nickName);
                    	currentTemplate = currentTemplate.replace("[FUNCTION]", func);
                    	currentTemplate = currentTemplate.replace("[TEXT]",notification.template.replace("[USERNICK]", notification.nickName));
                    	currentTemplate = currentTemplate.replace("[DATE]", notification.date);
                    	currentTemplate = currentTemplate.replace("[USER_ID]", notification.userId);
                    	currentTemplate = currentTemplate.replace("[IS_READ_CLASS]", isReadClass);
                    	currentTemplate = currentTemplate.replace("[BINGO_CLASS]", bingoClass);

						html = html + currentTemplate;
					}

					console.log("HTML: " + html);

					app.currentPageWrapper.find('.notifications_wrap').html(html);

				}

        	}
        });
	},

	checkBingo: function(){

		if(app.currentPageId != 'login_page' && app.currentPageId != 'register_page' && app.currentPageId != 'recovery_page'){

			if(checkBingo != ''){
				checkBingo.abort();
			}

			checkBingo = $.ajax({
				url: app.apiUrl + '/api/v4/user/bingo',
				type: 'Get',
				error: function(error){
					console.log("ERROR: " + JSON.stringify(error));
				},
				success: function(response){
					if(app.currentPageId != 'login_page' && app.currentPageId != 'register_page' && app.currentPageId != 'recovery_page'){
						console.log("SUCCESS: " + JSON.stringify(response));
						if(response.bingo.itemsNumber > 0){
							for(var i = 0; i < response.bingo.itemsNumber; i++){
								var bingo = response.bingo.items[i];

								if(!app.inBingosArray(bingo)){
									app.bingos.push(bingo);
								}
							}

							if(!app.bingoIsActive && app.currentPageId != 'chat_page'){
								app.splashBingo(response);
							}

						}

						setTimeout(app.checkBingo, 10000);
					}

				}
			});

        }

	},

	splashBingo: function(response){
		//alert(app.bingos.length);
		for(var i in app.bingos){
			if(typeof(app.bingos[i]) !== "undefined" ){
				//alert("Bingo " + i + ": " + JSON.stringify(app.bingos[i]));
				var bingo = app.bingos[i];
				var template = $('#bingoTemplate').html();
				
				template = template.replace("[USER_IMAGE_URL_1]", bingo.userImageUrl_1);
				template = template.replace("[USER_IMAGE_URL_2]", bingo.userImageUrl_2);
				template = template.replace("[USER_ID]", bingo.userId);
				template = template.replace(/\[USERNICK\]/g, bingo.nickName);

				$('#bingo_page').css({"background":"url('" + bingo.userImageUrl_2 + "') no-repeat center center", "background-size":"cover"}).html(template);
				app.showPage('bingo_page');

				app.bingoIsActive = true;
				app.setBingoAsSplashed(bingo, i);
				break;
			}
        }
	},

	setBingoAsSplashed: function(bingo, i){

		var data = JSON.stringify(bingo);

		$.ajax({
        	url: app.apiUrl + '/api/v4/user/bingo/splashed',
        	type: 'Post',
        	data: data,
        	error: function(error){
        		console.log("ERROR: " + JSON.stringify(error));
        	},
        	success: function(response){
        		console.log(JSON.stringify(response));
        		if(response.success){
        			app.bingos.splice(i, 1);
        		}
        	}
        });
	},

	inBingosArray: function(bingo){
		for(var i in app.bingos){
			if(app.bingos[i].id === bingo.id){
				return true;
			}
		}

		return false;
	},

	setUserNotificationAsRead: function(notifId, clickedObj){

		$.ajax({
        	url: app.apiUrl + '/api/v4/user/notification/' + notifId + '/read',
        	type: 'Post',
        	error: function(error){
        		console.log("ERROR: " + JSON.stringify(error));
        	},
        	success: function(response){
        		console.log(JSON.stringify(response));
        		$(clickedObj).addClass("isRead");
        	}
        });
	},

		
	dump: function(obj) {
	    var out = '';
	    for (var i in obj) {
	        out += i + ": " + obj[i] + "\n";
	    }
	    alert(out);
	}	
	
		
};


document.addEventListener("deviceready", app.init, false);

window.addEventListener('load', function() {
	new FastClick(document.body);
}, false);

function showPreview(coords)
{
	var rx = 100 / coords.w;
	var ry = 100 / coords.h;

	$('#preview').css({
		width: Math.round(rx * 500) + 'px',
		height: Math.round(ry * 370) + 'px',
		marginLeft: '-' + Math.round(rx * coords.x) + 'px',
		marginTop: '-' + Math.round(ry * coords.y) + 'px'
	});
}


$.fn.serializeObject = function()
{
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};




