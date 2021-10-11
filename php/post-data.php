<?php
$servername = "localhost";
// REPLACE with your Database name
$dbname = "weatherstation";
// REPLACE with Database user
$username = "weatherstation";
// REPLACE with Database user password
$password = "weatherpassword";

$api_key_value = "3Ag5A1278hFj7Fhgf9";

$api_key = $value1 = $value2 = $value3 = "";

if ($_SERVER["REQUEST_METHOD"] == "POST") {
// Begin debug printing
    foreach (getallheaders() as $name => $value) {
    	echo "$name: $value\n";
    }
    var_dump($_POST);
// End debug printing

    $api_key = test_input($_POST["api_key"]);
    if($api_key == $api_key_value) {
        $sensorGroup = test_input($_POST["sensorGroup"]);
        $value1 = test_input($_POST["value1"]);
        $value2 = test_input($_POST["value2"]);
        $value3 = test_input($_POST["value3"]);

        // Create connection
        $conn = new mysqli($servername, $username, $password, $dbname);
        // Check connection
        if ($conn->connect_error) {
            die("Connection failed: " . $conn->connect_error);
        }

        $query = "SELECT id FROM {$sensorGroup}";
        $result = mysqli_query($conn, $query);

        if (empty($result)) {
            $query = "CREATE TABLE {$sensorGroup} (
                        id int(11) AUTO_INCREMENT PRIMARY KEY,
                        value1 VARCHAR(10),
                        value2 VARCHAR(10),
                        value3 VARCHAR(10),
                        reading_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )";
            $result = mysqli_query($conn, $query);
        }

        $sql = "INSERT INTO {$sensorGroup} (value1, value2, value3)
        VALUES ('" . $value1 . "', '" . $value2 . "', '" . $value3 . "')";

        if ($conn->query($sql) === TRUE) {
            echo "New record created successfully";
        }
        else {
            echo "Error: ".$sql."<br>".$conn->error;
        }

        $conn->close();
    }
    else {
        echo "Wrong API Key provided: ".$api_key;
    }

}
else {
    echo "No data posted with HTTP POST.";
}

function test_input($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}
?>
