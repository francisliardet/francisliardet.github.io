<?php
  $servername = "localhost";
  // REPLACE with your Database name
  $dbname = "weatherstation";
  // REPLACE with Database user
  $username = "weatherstation";
  // REPLACE with Database user password
  $password = "weatherpassword";
  // Optionally change data set via hacky method
  $table = empty($_SERVER['QUERY_STRING']) ? "sensor_elissa" : $_SERVER['QUERY_STRING'];


  // Create connection
  $conn = new mysqli($servername, $username, $password, $dbname);
  // Check connection
  if ($conn->connect_error) {
      die("Connection failed: " . $conn->connect_error);
  } 

  $table_list = mysqli_query($conn, "SHOW TABLES FROM {$dbname}");

  $sql = "SELECT id, value1, value2, value3, reading_time FROM {$table} order by reading_time desc limit 40";

  $result = $conn->query($sql) or die($conn->error);

  while ($data = $result->fetch_assoc()){
      $sensor_data[] = $data;
  }

  $readings_time = array_column($sensor_data, 'reading_time');

  // ******* Uncomment to convert readings time array to your timezone ********
  //$i = 0;
  //foreach ($readings_time as $reading){
      // Uncomment to set timezone to - 1 hour (you can change 1 to any number)
      //$readings_time[$i] = date("Y-m-d H:i:s", strtotime("$reading - 1 hours"));
      // Uncomment to set timezone to + 4 hours (you can change 4 to any number)
  //    $readings_time[$i] = date("Y-m-d H:i:s", strtotime("$reading + 12 hours"));
  //    $i += 1;
  //}

  $table_list = json_encode(array_reverse($table_list));
  $value1 = json_encode(array_reverse(array_column($sensor_data, 'value1')), JSON_NUMERIC_CHECK);
  $value2 = json_encode(array_reverse(array_column($sensor_data, 'value2')), JSON_NUMERIC_CHECK);
  $value3 = json_encode(array_reverse(array_column($sensor_data, 'value3')), JSON_NUMERIC_CHECK);
  $reading_time = json_encode(array_reverse($readings_time), JSON_NUMERIC_CHECK);

  $result->free();
  $conn->close();
?>

<!DOCTYPE html>
<html>
  <meta name="viewport" content="width=device-width, initial-scale=1">
    <script src="https://code.highcharts.com/highcharts.js"></script>
    <style>
      body {
        min-width: 310px;
          max-width: 1280px;
          height: 500px;
        margin: 0 auto;
      }
      h2 {
        font-family: Arial;
        font-size: 2.5rem;
        text-align: center;
      }
    </style>

    <body>

      <h2>Plant Weather Station</h2>
      <div id="sensor-list" class="container"></div>
      <div id="chart-temperature" class="container"></div>
      <div id="chart-humidity" class="container"></div>
      <div id="chart-light" class="container"></div>

    <script>
      var table_list = <?php echo $table_list; ?>;
      var value1 = <?php echo $value1; ?>;
      var value2 = <?php echo $value2; ?>;
      var value3 = <?php echo $value3; ?>;
      var reading_time = <?php echo $reading_time; ?>;

      for (var i = 0; i < table_list.length; i++) {
        document.getElementById("sensor-list").innerHTML += "<a href=\"" + "https://furiousmelo.nz/php/post-data.php?" + table_list[i] + "\">" + table_list[i] + "</a>";
      }

      var chartT = new Highcharts.Chart({
        chart:{ renderTo : 'chart-temperature' },
        title: { text: 'DHT Temperature' },
        series: [{
          showInLegend: false,
          data: value1
        }],
        plotOptions: {
          line: { animation: false,
            dataLabels: { enabled: true }
          },
          series: { color: '#059e8a' }
        },
        xAxis: { 
          type: 'datetime',
          categories: reading_time
        },
        yAxis: {
          title: { text: 'Temperature (Celsius)' }
          //title: { text: 'Temperature (Fahrenheit)' }
        },
        credits: { enabled: false }
      });

      var chartH = new Highcharts.Chart({
        chart:{ renderTo:'chart-humidity' },
        title: { text: 'DHT Humidity' },
        series: [{
          showInLegend: false,
          data: value2
        }],
        plotOptions: {
          line: { animation: false,
            dataLabels: { enabled: true }
          }
        },
        xAxis: {
          type: 'datetime',
          //dateTimeLabelFormats: { second: '%H:%M:%S' },
          categories: reading_time
        },
        yAxis: {
          title: { text: 'Humidity (%)' }
        },
        credits: { enabled: false }
      });


      var chartP = new Highcharts.Chart({
        chart:{ renderTo:'chart-light' },
        title: { text: 'LDR Light Value' },
        series: [{
          showInLegend: false,
          data: value3
        }],
        plotOptions: {
          line: { animation: false,
            dataLabels: { enabled: true }
          },
          series: { color: '#18009c' }
        },
        xAxis: {
          type: 'datetime',
          categories: reading_time
        },
        yAxis: {
          title: { text: 'Light (%)' }
        },
        credits: { enabled: false }
      });
    </script>
  </body>
</html>

