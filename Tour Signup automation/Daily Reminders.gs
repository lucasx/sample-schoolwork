// VOID One of the scripts created with Google Appscript (A Javascript library) to manage
// tour signup at the Stanford VHIL.
// September 2014
// By Lucas Sanchez

var TOURS_SPREADSHEET_URL = /* censored */;

var REMINDER_OFFSETS = [4, 1]; // Number of days in advance to send each reminder

var MS_PER_DAY = 86400000; // Number of milliseconds in one day
var AM_HOURS = 12; //Number of hours in the first half of the day

/* Every day at 6 PM, checks the spreadsheet for any
 * upcoming tours planned for set amounts of days into the 
 * future. If there are any, sends a reminder email
 * to each person signed up for each relevant tour. */
function sendDailyReminders(e) {
  var today = new Date(e.year, e.month-1, e["day-of-month"]);
  
  //Open the VHIL Public Tours spreadsheet
  var spreadsheet = SpreadsheetApp.openByUrl(TOURS_SPREADSHEET_URL);
  
  var upcomingTours = getUpcomingTourDates(spreadsheet);
  if(!upcomingTours) return;
  
  //Check to see if today is a day for reminders to be sent out for any upcoming tour
  var toursToRemind = findToursToRemind(today, upcomingTours);
  if(toursToRemind.length === 0) return;
  
  sendReminders(toursToRemind, spreadsheet);
}

/* Returns an array of Date objects, each of which
 * is the date and time of one or more upcoming tours. */
function getUpcomingTourDates(sheet) {
  var upcomingDates = [];
  
  var tourDatesData = sheet.getRangeByName('upcomingTourDates').getValues(); //upcomingTours is a Named Range, declared in the spreadsheet under Data > Named and protected ranges
  for(var i in tourDatesData) {
    var tourSessionData = tourDatesData[i]; //One row of data, which represents one tour session
    
    var tourDate = parseDateFromData(tourSessionData);
    if (!tourDate) break;
    upcomingDates.push(tourDate);
  }

  return upcomingDates;
}

/* Returns a Date object parsed from the given string array that represents the 
 * date and time of a tour session. The strings should be in this order:
 
 * year, month, day, which hour the tour starts, which minute of the hour
 * the tour starts, whether the tour starts am or pm, which hour the tour ends,
 * which minute the tour ends, whether the tour ends am or pm.
 
 * If the first string in the given array cannot be parsed as an integer, returns NaN.*/
function parseDateFromData(sessionData) {
  var year = parseInt(sessionData[0]);
  if(!year) return year;
  year += 2000; //The sessionData entry must be adjusted because it is only two digits (i.e. 14 for 2014.)
  var month = parseInt(sessionData[1]) - 1;
  var day = parseInt(sessionData[2]);
  
  var date = new Date(year, month, day);
  
  var hour = normalToMilitaryTime(parseInt(sessionData[3]), sessionData[5].charAt(0));
  
  date.setHours(hour);
  date.setMinutes(sessionData[4]);
  
  //Add custom fields to this Date object in order to accommodate the ending time of the tour
  date.endHour = normalToMilitaryTime(parseInt(sessionData[6]), sessionData[8].charAt(0));
  date.endMinute = sessionData[7];
  
  return date;
}

/* Takes an integer (1-12) and the first character of the given String,
 * together representing a normal 12-hour-time hour, and returns the
 * correct corresponding military-time hour (0-23).
 * If the string starts with "a" or "A", it is AM. Anything else is PM. */
function normalToMilitaryTime(hour, aForAM) {
  if(aForAM !== 'a' && aForAM !== 'A') { //PM
    if(hour !== AM_HOURS) { //Not 12 PM
      hour += AM_HOURS;
    }
  } else if(hour === AM_HOURS) { //12 AM
    hour -= AM_HOURS
  }
  
  return hour;
}

/* Returns a Date object parsed from the given input string that represents the 
 * date and time of a tour session.
 * The string should start with 3 integers separated by 2 forward slashes.
 * The integers should represent the month, day, and year respectively. The
 * year should be abbreviated to two digits. Example: 2014 becomes 14. 
 * A space should come immediately after the 3 integers, and the character
 * after the space should be a digit representing the hour that
 * the tour starts. After that, there should be a colon, followed by two
 * characters representing the minute of the hour the tour starts on. The next
 * character should be an "A" or a "P". Everything after that is discarded.
 * Example input string:
 * 7/13/14 4:00PM - 5:00PM
 */
function parseDateFromString(session) {
  var dateAndTime = session.split(' ');
  var dateString = dateAndTime[0];
  var dateValues = dateString.split('/');
  
  var month = dateValues[0] - 1; //Convert to 0-based (January = 0, December = 11)
  var day = dateValues[1];
  var year = "20" + dateValues[2];
  
  var date = new Date(year, month, day);
  
  var startTime = dateAndTime[1]; //"4:00PM"
  if(startTime === '-') startTime = dateAndTime[2];
  
  var timeDigits = startTime.split(':');// 4, 00PM
  
  var hourOfDay = normalToMilitaryTime( parseInt(timeDigits[0]), timeDigits[1].charAt(2) );
  date.setHours(hourOfDay);
  var minutes = timeDigits[1].charAt(0) + timeDigits[1].charAt(1); //00
  date.setMinutes(parseInt(minutes));
  
  return date;
}

/* Searches through the given array of upcoming tour
 * dates for tours that are happening X days into the
 * future from the given 'today' date. X iterates through
 * each value in the array REMINDER_OFFSETS. Returns an array
 * of the tours that match. */
function findToursToRemind(today, upcomingTours) {
  var toursToRemind = [];
  for(var i in upcomingTours) {
    var tourDay = new Date(upcomingTours[i].getFullYear(), upcomingTours[i].getMonth(), upcomingTours[i].getDate());
    
    for(var j in REMINDER_OFFSETS) { //Test today for each reminder offset from the tour
      
      var reminderOffset = MS_PER_DAY*REMINDER_OFFSETS[j]; //Offset of the day of the email reminder from the day of its corresponding tour (in milliseconds)
      
      if(tourDay.getTime() === today.getTime() + reminderOffset) {
        toursToRemind.push(upcomingTours[i]);
      }
      
    }
  }
  
  return toursToRemind;
}

/* Sends a reminder email to each visitor signed up for
 * each tour in the given array of tours. */
function sendReminders(toursToRemind, sheet) {
  
  /* For debugging purposes only - delete later */
  /**/var emailList = "";/**/
  /*Delete later*/
  
  for(var i in toursToRemind) {
    var visitorEmails = getEmailAddresses(toursToRemind[i], sheet);
    emailList += (visitorEmails.toString() + ",");
    
    var tourString = dateToTourtime(toursToRemind[i]);
    
    for(var j in visitorEmails) {
      
      MailApp.sendEmail(visitorEmails[j],
                    "VHIL Tour Reminder", 
                    "Thank you for signing up for a tour of the Virtual Human Interaction Lab." +
                    " As a reminder, you signed up the following tour:\n\n" +
                    tourString + "\n\n" +
                    "We are located on the fourth floor of McClatchy Hall (Building 120) in the Main Quad." +
                    " If you are on the waitlist, someone will contact you if space becomes available." + 
                    " Otherwise, please plan to arrive 5 minutes before your tour. \n\n" +
                    "Sincerely,\n The VHIL Team",
                    {name:"Virtual Human Interaction Lab"});
    }
  }
    
    
    //The following code's purpose is for Debugging - delete it later
    /*
    MailApp.sendEmail("vhilab@gmail.com",
                      "VHIL Tour Reminders daily report",
                      "This email is a notification that the Daily Reminders script has just run.\n" +
                      "The script has detected the following upcoming tours to remind people about:\n\n" +
                      toursToRemind.toString() + "\n\n" +
                      "and has notified the following email addresses about one of the above tours:\n" +
                      emailList + ".\n\n" +
                      "This is a temporary recurring email message meant to confirm that everything is working properly. It will not spam the inbox every day forever.",
                        {name:"Virtual Human Interaction Lab"});*/
}

/* Returns an array of strings. Each string
 * is the email address of a visitor who is
 * signed up for a tour on the given date. */
function getEmailAddresses(tourDate, sheet) {
  var emails = [];
  
  var tourTimeData = sheet.getRangeByName('selectedTours').getValues();
  var emailData = sheet.getRangeByName('visitorEmails').getValues();
  
  for(var i in tourTimeData) {
    var tourSession = tourTimeData[i][0];
    
    if(tourSession) {
      var date = parseDateFromString(tourSession);
      if(date.getTime() === tourDate.getTime()) {
        if(emailData[i][0]) {
          emails.push(emailData[i][0]);
        }
      }
    }
    
  }
  
  return emails;
}

/* Converts the given date object to a string representing a tour. */
function dateToTourtime(date) {
  var string = "";
  
  string =
    (date.getMonth()+1) +
    "/" +
    date.getDate() +
    "/" +
    date.getFullYear().toString().substring(2) +
    " ";
  
  var startHour = date.getHours();
  //Convert military-time into 12-hour-time string
  
  //Start time
  var pm = false;
  if(startHour >= AM_HOURS) {
    pm = true;
    if(startHour > AM_HOURS) {
      startHour -= AM_HOURS;
    }
  }
  
  var startMinutes = date.getMinutes().toString();
  if(parseInt(startMinutes) < 10) startMinutes = "0" + startMinutes;
  
  string += startHour + ":" + startMinutes;
  if(pm) {
    string += "PM";
  } else string += "AM";
  
  string += " - ";
  
  //End time
  var endHour = date.endHour;
  
  if(endHour) {
    pm = false;
    if(endHour >= AM_HOURS) {
      pm = true;
      if(endHour > AM_HOURS) {
        endHour -= AM_HOURS;
      }
    }
  } else {
    endHour = (startHour + 1);
    if(endHour === 13) {
      pm = !pm;
      endHour = 1;
    }
  }
  
  var endMinute = date.endMinute;
  if(endMinute) {
    if(parseInt(endMinute) < 10) endMinute = "0" + endMinute;
  } else {
    endMinute = "00";
  }
  
  string += endHour + ":" + endMinute;
  if(pm) {
    string += "PM";
  } else string += "AM";
  
  return string;
}