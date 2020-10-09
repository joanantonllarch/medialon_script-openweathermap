// 1. Script Begins
({
    //*************************************************************************
    // 2. Information
    //*************************************************************************
    Info:
    {   Title:"Openweathermap v1.0.3",
        Author:"Joan A. Llarch - Barcelona - October 2020",
        Version:"1.0.3",
        Description:"Openweathermap - One Call API" ,
        Setup:
        {   appid:
            {   Widget:"LineEdit",
                MaxLength: 100,
                Width: 420,
                Name:"App Id",
            },	
            latitud:	 
            {   Widget:"LineEdit",
                Width: 60,
                Name:"Latitud +90/-90",
                Type: "Real",
                Precision: 2,
                MinValue: -90,
                MaxValue: 90,
            },	   
            longitud:	 
            {   Widget:"LineEdit",
                Width: 60,
                Name:"Longitud +180/-180",
                Type: "Real",
                Precision: 2,
                MinValue: -180,
                MaxValue: 180,
            },               
        },  
        Commands: 
        {   one_call: 
            {   Name: "Send One Call",
                GroupCmdOrder: "1",
            },
        },    
    },
    //*************************************************************************
    //  3. Setup Variables
    //*************************************************************************
    Setup:
    {   appid: "",
        latitud: 0.00,	 	   
        longitud: 0.00,
    },
    //*************************************************************************
    //  4. Device Variables
    //*************************************************************************
    Device: 
    {   // status
        lastStatusCode: "",
        lastError:"",
    },
    //*************************************************************************
    //  4. Local Script Variables
    //*************************************************************************
    // "constants"
    itemsEncoding: false,                               // false => encoding by manager
    openWeatherMapUrl: "https://api.openweathermap.org/data/2.5/onecall?",   
    //*************************************************************************
    //  5. Script Public Functions
   //**************************************************************************
    //  SEND TEXT MESSAGE
    one_call: function( ){
        var items = "lat=" + this.Setup.latitud + "&lon=" + this.Setup.longitud + "&appid=" + this.Setup.appid;
        items = items + "&units=metric";
        var requestHeaders = "";
        this.HttpClientOneCall.get(this.openWeatherMapUrl, requestHeaders, items, this.itemsEncoding);
    },
    //*************************************************************************
    //  5b. Script Private Functions
    //*************************************************************************
    _response_one_call: function ( response, error ) {
        if ( error.errorCode == 0 )
        {   this.Device.lastStatusCode = response.statusCode;
            if ( response.data != "" )
            {   try {
                    // to object
                    var answer = JSON.parse(response.data.toString());
                    this._parse_recv( answer );
                }
                catch(e) {
                    this.Device.lastError = this.errorNoJson;
                    return;
                }
            }
        }
    },
    //*************************************************************************
    _parse_recv: function ( answer ) {
        // next 48 hours
        for ( var i = 0; i<48; i++ )
        {   var value;
            // hours
            var hour = this._unix_convert( answer.hourly[i].dt + answer.timezone_offset );
            QMedialon.SetValue( "TXT_temp_hour_" + i + ".Text" , hour );
            // temp degrees
            QMedialon.SetValue( "TXT_temp_value_" + i + ".Text" , answer.hourly[i].temp.toFixed(1) );
            value = ( answer.hourly[i].temp - 10 ) * 10;
            if ( value >= 1 && value < 2  )
                // graphic cheat
                value = 2;
            QMedialon.SetValue( "GAG_temp_" + i + ".Status" , value );
            // rain probability
            value = (answer.hourly[i].pop * 100).toFixed(0);
            QMedialon.SetValue( "TXT_rain_value_" + i + ".Text" , value );
            QMedialon.SetValue( "GAG_rain_" + i + ".Status" , value * 2 );
            // wind speed
            QMedialon.SetValue( "TXT_wind_value_" + i + ".Text" , answer.hourly[i].wind_speed.toFixed(1) );
            value = answer.hourly[i].wind_speed * 10;
            if ( value >= 1 && value < 2  )
                value = 2;
            QMedialon.SetValue( "GAG_wind_" + i + ".Status" , value );
        }
        // current
        QMedialon.SetValue( "TXT_temp_current.Text" , "Temp: " + answer.current.temp + " dgC" );
        var string = answer.current.weather[0].description;
        var status = string.charAt(0).toUpperCase() + string.slice(1);
        QMedialon.SetValue( "TXT_weather_current.Text" , status );
        QMedialon.SetValue( "TXT_wind_current.Text" , "Wind: " + answer.current.wind_speed + " m/s" );
    },
    //*************************************************************************
    // convert to time from Unix - return hour only
    _unix_convert: function ( t ) {
        var sec = t % 60;
        t /= 60;
        var min = t % 60;
        t /= 60;
        var hour = t % 24;
        return hour;
    },
    //*************************************************************************
    _clear_values : function() {
        for ( var i = 0; i<48; i++ )
        {   QMedialon.SetValue( "TXT_temp_value_" + i + ".Text" , '' );
            QMedialon.SetValue( "GAG_temp_" + i + ".Status" , 0 );
            QMedialon.SetValue( "TXT_temp_hour_" + i + ".Text" , '' );
            QMedialon.SetValue( "TXT_rain_value_" + i + ".Text" , '' );
            QMedialon.SetValue( "GAG_rain_" + i + ".Status" , 0 );
            QMedialon.SetValue( "TXT_rain_hour_" + i + ".Text" , '' );
            QMedialon.SetValue( "TXT_wind_value_" + i + ".Text" , '' );
            QMedialon.SetValue( "GAG_wind_" + i + ".Status" , 0 );
            QMedialon.SetValue( "TXT_wind_hour_" + i + ".Text" , '' );
        }
        QMedialon.SetValue( "TXT_temp_current.Text" , '?' );
        QMedialon.SetValue( "TXT_weather_current.Text" , '?' );
        QMedialon.SetValue( "TXT_wind_current.Text" , '?' );
    },
    //************************************************************************
    //  SETUP HTTP CLIENTS - ONE FOR EACH FUNCTION THAT MAKES A POST
    _setup_http_clients: function () {
        // the client object
        this.HttpClientOneCall = QMedialon.CreateHTTPClient();
        // the call back
        this.HttpClientOneCall.on( 'response', this._response_one_call );
    },
    //*************************************************************************
    _mStart : function() {
        this._setup_http_clients();
        this._clear_values();
    },
    //*************************************************************************
// 6. Script Ends
}) 