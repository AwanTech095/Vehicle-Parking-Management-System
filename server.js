const express = require('express');
const sql = require('mssql');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json()); // Middleware for JSON parsing

//const jwt = require('jsonwebtoken');

// Authentication middleware
/*const authenticateToken = (req, res, next) => {
  // Get the token from the request header
  const token = req.header('Authorization') && req.header('Authorization').split(' ')[1];

  if (!token) {
    return res.status(403).json({ message: 'Access Denied: No Token Provided' });
  }

  // Verify the token
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Access Denied: Invalid Token' });
    }
    req.user = user;
    next();
  });
};*/
const PORT = 5000

const config = {
    user: "vpms",
    password: "123456",
    server: "DESKTOP-VBBN320/SQLEXPRESS",
    database: "VehicleManagement",
    options: {
        trustServerCertificate: true,
        trustedconnection: false,
        enableArithAbort: true,
        instancename: "SQLEXPRESS",
    },
    port: 1433
};

// Create a global connection pool
let pool;
sql.connect(config).then(p => {
    pool = p;
    console.log("✅ Connected to the database!");
}).catch(err => console.error("Database Connection Failed:", err));

app.listen(5000, () => {
    console.log("Server is running on http://localhost:5000");
});


//-----------------------------------------USERS-----------------------------------//
//app.use(authenticateToken);
// List all registered users
app.get('/users', async (req, res) => {
    try {
        const result = await pool.request().query("SELECT * FROM Users");
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error("Error fetching users:", err);
        res.status(500).json({ error: err.message });
    }
});

// Search for a user by user_id or contact number
app.post('/users/search', async (req, res) => {
    const { user_id, contact } = req.body; 

    try {
        const query = `
            SELECT * FROM Users 
            WHERE 
                (@user_id IS NULL OR user_id = @user_id) 
                AND 
                (@contact IS NULL OR contact_number = @contact)
        `;

        const request = pool.request();

        if (user_id) request.input('user_id', sql.Int, user_id);
        if (contact) request.input('contact', sql.VarChar, contact);

        const result = await request.query(query);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "No users found" });
        }

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error("Error searching user:", err);
        res.status(500).json({ error: err.message });
    }
});

// Count Total Users
app.get('/users/count', async (req, res) => {
    try {
        if (!pool) {
            return res.status(500).json({ error: "Database connection not established" });
        }

        const result = await pool.request().query("SELECT COUNT(*) AS total_users FROM Users");
        res.status(200).json(result.recordset[0]);
    } catch (err) {
        console.error("Error counting users:", err);
        res.status(500).json({ error: err.message });
    }
});


// Insert a new user
app.post('/users', async (req, res) => {
    const { name, contact_number, email } = req.body;
    if (!name || !contact_number || !email) {
        return res.status(400).json({ error: "All fields (name, contact_number, email) are required" });
    }
    try {
        const query = `
            INSERT INTO Users (name, contact_number, email)
            VALUES (@name, @contact_number, @email);
        `;
        await pool.request()
            .input('name', sql.VarChar, name)
            .input('contact_number', sql.VarChar, contact_number)
            .input('email', sql.VarChar, email)
            .query(query);
        res.status(201).json({ message: "User added successfully" });
    } catch (err) {
        console.error("Error adding user:", err);
        res.status(500).json({ error: err.originalError ? err.originalError.message : err.message });
    }
});

// Delete a user by user_id
app.delete('/users/delete', async (req, res) => {
    const { user_id } = req.body; 

    if (!user_id) {
        return res.status(400).json({ error: "User ID is required" });
    }

    try {
        const query = `DELETE FROM Users WHERE user_id = @user_id`;
        const result = await pool.request()
            .input('user_id', sql.Int, user_id)
            .query(query);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json({ message: "User deleted successfully" });

    } catch (err) {
        console.error("Error deleting user:", err);
        res.status(500).json({ error: err.message });
    }
});

// Update user details by user_id
app.put('/users/:user_id', async (req, res) => {
    const { user_id } = req.params;
    const { name, contact_number, email } = req.body;

    if (!name || !contact_number || !email) {
        return res.status(400).json({ error: "All fields (name, contact_number, email) are required." });
    }

    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input("user_id", sql.Int, user_id)
            .input("name", sql.VarChar, name)
            .input("contact_number", sql.VarChar, contact_number)
            .input("email", sql.VarChar, email)
            .query(`
                UPDATE Users
                SET name = @name, 
                    contact_number = @contact_number, 
                    email = @email
                WHERE user_id = @user_id
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json({ message: "User updated successfully" });
    } catch (err) {
        console.error("Error updating user:", err);
        res.status(500).json({ error: err.message });
    }
});


//------------------------------------------VEHICLES-----------------------------------//
// Find a vehicle by license plate
app.post('/vehicles/license_plate', async (req, res) => {
    const { license_plate } = req.body; // Extract from request body

    if (!license_plate) {
        return res.status(400).json({ error: "License plate is required" });
    }

    try {
        const query = `SELECT * FROM Vehicles WHERE license_plate = @license_plate`;
        const request = pool.request();
        request.input('license_plate', sql.VarChar, license_plate);

        const result = await request.query(query);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "No vehicle found with this license plate" });
        }

        res.status(200).json(result.recordset[0]);
    } catch (err) {
        console.error("Error finding vehicle:", err);
        res.status(500).json({ error: err.message });
    }
});

// Count vehicles by type
app.get('/vehicles/count', async (req, res) => {
    try {
        const result = await pool.request()
            .query("SELECT vehicle_type, COUNT(*) AS total FROM Vehicles GROUP BY vehicle_type");

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error("Error counting vehicles:", err);
        res.status(500).json({ error: err.message });
    }
});

// Insert a new vehicle
app.post('/vehicles', async (req, res) => {
    const { license_plate, vehicle_type } = req.body;

    if (!license_plate || !vehicle_type) {
        return res.status(400).json({ error: "Both license_plate and vehicle_type are required" });
    }

    try {
        const query = `
            INSERT INTO Vehicles (license_plate, vehicle_type)
            VALUES (@license_plate, @vehicle_type);
        `;
        
        await pool.request()
            .input('license_plate', sql.VarChar, license_plate)
            .input('vehicle_type', sql.VarChar, vehicle_type)
            .query(query);

        res.status(201).json({ message: "Vehicle added successfully" });
    } catch (err) {
        console.error("Error adding vehicle:", err);
        res.status(500).json({ error: err.originalError ? err.originalError.message : err.message });
    }
});

//Delete a vehicle by license plate
app.delete('/vehicles', async (req, res) => {
    const { license_plate } = req.body;

    if (!license_plate) {
        return res.status(400).json({ error: "License plate is required" });
    }

    try {
        const query = `DELETE FROM Vehicles WHERE license_plate = @license_plate`;
        const request = pool.request();
        request.input('license_plate', sql.VarChar, license_plate);

        const result = await request.query(query);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: "Vehicle not found" });
        }

        res.status(200).json({ message: "Vehicle deleted successfully" });
    } catch (err) {
        console.error("Error deleting vehicle:", err);
        res.status(500).json({ error: err.message });
    }
});

//------------------------------------------UserVehicle-----------------------------------//
//displaying all vehicles owned by users
app.get('/userVehicles', async (req, res) => {
    try {
        const query = `
            SELECT uv.user_vehicle_id, u.name AS user_name, v.license_plate, v.vehicle_type
            FROM UserVehicles uv
            JOIN Users u ON uv.user_id = u.user_id
            JOIN Vehicles v ON uv.vehicle_id = v.vehicle_id;
        `;

        const result = await pool.request().query(query);
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error("Error fetching user vehicles:", err);
        res.status(500).json({ error: err.message });
    }
});

//Check if a vehicle is already assigned to a user
app.post('/userVehicles/check', async (req, res) => {
    const { vehicle_id } = req.body; 

    if (!vehicle_id) {
        return res.status(400).json({ error: "Vehicle ID is required" });
    }

    try {
        const query = "SELECT * FROM UserVehicles WHERE vehicle_id = @vehicle_id";
        const result = await pool.request()
            .input('vehicle_id', sql.Int, vehicle_id)
            .query(query);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "Vehicle is not assigned to any user." });
        }

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error("Error checking vehicle assignment:", err);
        res.status(500).json({ error: err.message });
    }
});

//retrieves all vehicles owned by a specific user
app.post('/userVehicles', async (req, res) => {
    const { user_id } = req.body; 

    if (!user_id) {
        return res.status(400).json({ error: "User ID is required" });
    }

    try {
        const query = `
            SELECT uv.user_vehicle_id, u.name AS user_name, v.license_plate, v.vehicle_type
            FROM UserVehicles uv
            JOIN Users u ON uv.user_id = u.user_id
            JOIN Vehicles v ON uv.vehicle_id = v.vehicle_id
            WHERE uv.user_id = @user_id;
        `;

        const result = await pool.request()
            .input('user_id', sql.Int, user_id)
            .query(query);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "No vehicles assigned to this user" });
        }

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error("Error fetching vehicles for user:", err);
        res.status(500).json({ error: err.message });
    }
});

// Assign a vehicle to a user
app.post('/userVehicles', async (req, res) => {
    const { user_id, vehicle_id } = req.body; // Get user_id and vehicle_id from request body

    if (!user_id || !vehicle_id) {
        return res.status(400).json({ error: "User ID and Vehicle ID are required" });
    }

    try {
        const query = `
            INSERT INTO UserVehicles (user_id, vehicle_id) 
            VALUES (@user_id, @vehicle_id);
        `;
        
        await pool.request()
            .input('user_id', sql.Int, user_id)
            .input('vehicle_id', sql.Int, vehicle_id)
            .query(query);

        res.status(201).json({ message: "Vehicle assigned to user successfully" });

    } catch (err) {
        console.error("Error assigning vehicle:", err);
        res.status(500).json({ error: err.message });
    }
});

// Unassign a vehicle from a user
app.delete('/userVehicles', async (req, res) => {
    const { user_id, vehicle_id } = req.body; // Get user_id and vehicle_id from request body

    if (!user_id || !vehicle_id) {
        return res.status(400).json({ error: "User ID and Vehicle ID are required" });
    }

    try {
        const query = `
            DELETE FROM UserVehicles 
            WHERE user_id = @user_id AND vehicle_id = @vehicle_id;
        `;
        
        const result = await pool.request()
            .input('user_id', sql.Int, user_id)
            .input('vehicle_id', sql.Int, vehicle_id)
            .query(query);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "No assignment found for the given user and vehicle" });
        }

        res.status(200).json({ message: "Vehicle unassigned from user successfully" });

    } catch (err) {
        console.error("Error deleting vehicle assignment:", err);
        res.status(500).json({ error: err.message });
    }
});


//------------------------------------------Parkin Slots-----------------------------------//
//FETCH ALL PARKING SLOTS
app.get('/parkingSlots', async (req, res) => {
    try {
        const result = await pool.request().query("SELECT * FROM ParkingSlots");
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error("Error fetching parking slots:", err);
        res.status(500).json({ error: err.message });
    }
});

//FETCH AVAILABLE PARKING SLOTS BY VEHICLE TYPE
app.post('/parkingSlots/available', async (req, res) => {
    const { vehicle_type } = req.body; // Extract vehicle_type from request body

    if (!vehicle_type) {
        return res.status(400).json({ error: "Vehicle type is required" });
    }

    try {
        const query = `
            SELECT * FROM ParkingSlots 
            WHERE status = 'Available' 
            AND vehicle_type = @vehicle_type;
        `;

        const result = await pool.request()
            .input('vehicle_type', sql.VarChar, vehicle_type)
            .query(query);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "No available slots for this vehicle type" });
        }

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error("Error fetching available slots:", err);
        res.status(500).json({ error: err.message });
    }
});

//COUNT PARKING SLOT UTILIZATION BY VEHICLE TYPE
app.get('/parkingSlots/utilization', async (req, res) => {
    try {
        const query = `
            SELECT vehicle_type, status, COUNT(*) AS total
            FROM ParkingSlots
            GROUP BY vehicle_type, status;
        `;

        const result = await pool.request().query(query);
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error("Error counting parking slot utilization:", err);
        res.status(500).json({ error: err.message });
    }
});
app.put('/parkingSlots/update-status', async (req, res) => {
    const { slot_id, status } = req.body;
  
    if (!slot_id || !status) {
      return res.status(400).json({ error: "slot_id and status are required" });
    }
  
    try {
      const result = await pool.request()
        .input("slot_id", sql.Int, slot_id)
        .input("status", sql.VarChar(10), status)
        .query("UPDATE ParkingSlots SET status = @status WHERE slot_id = @slot_id");
  
      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ error: "Slot not found" });
      }
  
      res.status(200).json({ message: "Slot status updated successfully" });
    } catch (err) {
      console.error("Error updating slot status:", err);
      res.status(500).json({ error: err.message });
    }
  });
  

  app.get("/parkingSlots/with-records", async (req, res) => {
    try {
      const result = await pool.request().query(`
        SELECT 
          ps.slot_id,
          ps.slot_number,
          ps.vehicle_type,
          ps.status,
          pr.record_id,
          pr.exit_time
        FROM ParkingSlots ps
        LEFT JOIN (
          SELECT pr1.*
          FROM ParkingRecords pr1
          INNER JOIN (
            SELECT slot_id, MAX(entry_time) AS latest_entry
            FROM ParkingRecords
            GROUP BY slot_id
          ) pr2 ON pr1.slot_id = pr2.slot_id AND pr1.entry_time = pr2.latest_entry
        ) pr ON ps.slot_id = pr.slot_id
      `);
  
      res.status(200).json(result.recordset);
    } catch (err) {
      console.error("Error fetching slots with records:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  
  

// GET: Retrieve all parking slots along with any active parking record (if exists)
// PUT: Update exit time of a parking record
app.put("/parkingRecords/update-exit-time", async (req, res) => {
    const { record_id, exit_time } = req.body;
  
    if (!record_id || !exit_time) {
      return res.status(400).json({ error: "record_id and exit_time required" });
    }
  
    try {
      const parsedExitTime = new Date(exit_time); // ensure proper format
      await pool.request()
        .input("record_id", sql.Int, record_id)
        .input("exit_time", sql.DateTime, parsedExitTime)
        .query(`UPDATE ParkingRecords SET exit_time = @exit_time WHERE record_id = @record_id`);
  
      res.status(200).json({ message: "✅ Exit time updated successfully" });
    } catch (err) {
      console.error("❌ Error updating exit time:", err);
      res.status(500).json({ error: "❌ Failed to update exit time" });
    }
  });
  
  
  
  

//--------------------------------BOOKINGS-----------------------------------//
// Fetch all bookings
app.get('/bookings', async (req, res) => {
    try {
        const result = await pool.request().query("SELECT * FROM Bookings");
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error("Error fetching bookings:", err);
        res.status(500).json({ error: err.message });
    }
});

// Check overlapping bookings for a slot (prevent overbooking)
app.get('/bookings/check-overlap', async (req, res) => {
    const { slot_id, start_time, end_time } = req.query;
    if (!slot_id || !start_time || !end_time) {
        return res.status(400).json({ error: "Missing required parameters" });
    }
    try {
        const query = `SELECT * FROM Bookings WHERE slot_id = @slot_id 
                       AND booking_start_time < @end_time 
                       AND booking_end_time > @start_time`;
        const result = await pool.request()
            .input('slot_id', sql.Int, slot_id)
            .input('start_time', sql.DateTime, start_time)
            .input('end_time', sql.DateTime, end_time)
            .query(query);
        res.status(200).json({ overlapping: result.recordset.length > 0, bookings: result.recordset });
    } catch (err) {
        console.error("Error checking overlapping bookings:", err);
        res.status(500).json({ error: err.message });
    }
});

// List bookings by user
app.get('/bookings/user/:user_id', async (req, res) => {
    const { user_id } = req.params;
    if (!user_id) {
        return res.status(400).json({ error: "User ID is required" });
    }
    try {
        const query = `SELECT b.*, u.name, v.license_plate FROM Bookings b 
                       JOIN UserVehicles uv ON b.user_vehicle_id = uv.user_vehicle_id 
                       JOIN Users u ON uv.user_id = u.user_id 
                       JOIN Vehicles v ON uv.vehicle_id = v.vehicle_id 
                       WHERE u.user_id = @user_id`;
        const result = await pool.request()
            .input('user_id', sql.Int, user_id)
            .query(query);
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error("Error fetching bookings by user:", err);
        res.status(500).json({ error: err.message });
    }
});

// Fetch active bookings (Confirmed & Completed)
app.get('/bookings/active', async (req, res) => {
    try {
        const result = await pool.request()
            .query("SELECT * FROM Bookings WHERE status IN ('Confirmed', 'Completed')");
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error("Error fetching active bookings:", err);
        res.status(500).json({ error: err.message });
    }
});

// Create a new booking
app.post("/bookings", async (req, res) => {
    const { user_vehicle_id, slot_id, booking_start_time, booking_end_time, tariff_id, status } = req.body;

    if (!user_vehicle_id || !slot_id || !booking_start_time || !booking_end_time) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const pool = await sql.connect(config);
        const request = pool.request()
            .input("user_vehicle_id", sql.Int, user_vehicle_id)
            .input("slot_id", sql.Int, slot_id)
            .input("booking_start_time", sql.DateTime, booking_start_time)
            .input("booking_end_time", sql.DateTime, booking_end_time)
            .input("tariff_id", sql.Int, tariff_id ?? null)  // uses null if undefined
            .input("status", sql.VarChar(20), status || 'Confirmed');

        const query = `
            INSERT INTO Bookings (user_vehicle_id, slot_id, booking_start_time, booking_end_time, tariff_id, status)
            VALUES (@user_vehicle_id, @slot_id, @booking_start_time, @booking_end_time, @tariff_id, @status)
        `;

        await request.query(query);
        res.status(201).json({ message: "Booking created successfully" });

    } catch (err) {
        console.error("Error creating booking:", err);
        res.status(500).json({ error: err.message });
    }
});


// Get bookings (supports user_id, slot_id, active bookings, overlapping time checks)
app.get("/bookings", async (req, res) => {
    const { slot_id, user_id, active, start, end } = req.query;
    const inputs = [];
    let query = `
        SELECT b.*, u.name, v.license_plate
        FROM Bookings b
        JOIN UserVehicles uv ON b.user_vehicle_id = uv.user_vehicle_id
        JOIN Users u ON uv.user_id = u.user_id
        JOIN Vehicles v ON uv.vehicle_id = v.vehicle_id
    `;
    let conditions = [];

    if (slot_id && start && end) {
        conditions.push("b.slot_id = @slot_id AND b.booking_start_time < @end AND b.booking_end_time > @start");
        inputs.push({ name: "slot_id", type: sql.Int, value: slot_id });
        inputs.push({ name: "start", type: sql.DateTime, value: start });
        inputs.push({ name: "end", type: sql.DateTime, value: end });
    }

    if (user_id) {
        conditions.push("uv.user_id = @user_id");
        inputs.push({ name: "user_id", type: sql.Int, value: user_id });
    }

    if (active === 'true') {
        conditions.push("b.status IN ('Confirmed', 'Completed')");
    }

    if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
    }

    try {
        const pool = await sql.connect(config);
        const request = pool.request();
        inputs.forEach(input => request.input(input.name, input.type, input.value));
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error("Error fetching bookings:", err);
        res.status(500).json({ error: err.message });
    }
});
app.get("/bookings/all", async (req, res) => {
    try {
      const result = await pool.request().query(`
        SELECT 
          b.booking_id,
          u.name AS user_name,
          v.license_plate,
          s.slot_number,
          b.booking_start_time,
          b.booking_end_time,
          b.status
        FROM Bookings b
        JOIN UserVehicles uv ON b.user_vehicle_id = uv.user_vehicle_id
        JOIN Users u ON uv.user_id = u.user_id
        JOIN Vehicles v ON uv.vehicle_id = v.vehicle_id
        JOIN ParkingSlots s ON b.slot_id = s.slot_id
        ORDER BY b.booking_start_time DESC;
      `);
  
      res.status(200).json(result.recordset);
    } catch (err) {
      console.error("Error fetching all bookings:", err);
      res.status(500).json({ error: err.message });
    }
  });
  
  
// Delete a booking by booking_id
app.delete("/bookings/delete", async (req, res) => {
    const { booking_id } = req.body;

    if (!booking_id) {
        return res.status(400).json({ error: "Booking ID is required" });
    }

    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input("booking_id", sql.Int, booking_id)
            .query("DELETE FROM Bookings WHERE booking_id = @booking_id");

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: "Booking not found" });
        }

        res.status(200).json({ message: "Booking deleted successfully" });
    } catch (err) {
        console.error("Error deleting booking:", err);
        res.status(500).json({ error: err.message });
    }
});


//------------------------------------------Parking Records-----------------------------------//

//Create a new parking record
/*app.post("/parking-records", async (req, res) => {
    const { vehicle_id, slot_id, entry_time } = req.body;

    if (!vehicle_id || !slot_id || !entry_time) {
        return res.status(400).json({ error: "Vehicle ID, Slot ID, and Entry Time are required." });
    }

    try {
        const pool = await sql.connect(config);
        
        // Use the optional booking_id only if available
        const result = await pool.request()
            .input("vehicle_id", sql.Int, vehicle_id)
            .input("slot_id", sql.Int, slot_id)
            .input("entry_time", sql.DateTime, entry_time)
            //.input("exit_time", exit_time ? sql.DateTime : null, exit_time || null)
            .query(`
                INSERT INTO ParkingRecords (vehicle_id, slot_id, entry_time)
                VALUES (@vehicle_id, @slot_id, @entry_time)
            `);

        res.status(201).json({ message: "Parking record created successfully" });
    } catch (err) {
        console.error("Error creating parking record:", err);
        res.status(500).json({ error: err.message });
    }
});
*/
app.post("/parking-records", async (req, res) => {
    const { vehicle_id, slot_id, entry_time, booking_id } = req.body; // Now getting booking_id from request body

    if (!vehicle_id || !slot_id || !entry_time) {
        return res.status(400).json({ error: "Vehicle ID, Slot ID, and Entry Time are required." });
    }

    try {
        const pool = await sql.connect(config);
        
        // Use the optional booking_id only if available
        const result = await pool.request()
            .input("vehicle_id", sql.Int, vehicle_id)
            .input("slot_id", sql.Int, slot_id)
            .input("entry_time", sql.DateTime, entry_time)
            .input("booking_id", booking_id ? sql.Int : null, booking_id || null)  // Conditionally set booking_id if provided
            .query(`
                INSERT INTO ParkingRecords (vehicle_id, slot_id, entry_time, booking_id)
                VALUES (@vehicle_id, @slot_id, @entry_time, @booking_id)
            `);

        res.status(201).json({ message: "Parking record created successfully" });
    } catch (err) {
        console.error("Error creating parking record:", err);
        res.status(500).json({ error: err.message });
    }
});



//Get all parking records
app.get("/parking-records", async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query("SELECT * FROM ParkingRecords");
        res.json(result.recordset);
    } catch (err) {
        console.error("Error fetching parking records:", err);
        res.status(500).json({ error: err.message });
    }
});

//Get parking records by vehicle ID (Parking history for a vehicle)
app.get("/parking-records/vehicle", async (req, res) => {
    const { vehicle_id } = req.query;

    if (!vehicle_id) {
        return res.status(400).json({ error: "Vehicle ID is required" });
    }

    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input("vehicle_id", sql.Int, vehicle_id)
            .query("SELECT * FROM ParkingRecords WHERE vehicle_id = @vehicle_id");
        res.json(result.recordset);
    } catch (err) {
        console.error("Error fetching vehicle parking history:", err);
        res.status(500).json({ error: err.message });
    }
});

//Get active (currently parked) vehicles (records with no exit_time)
app.get("/parking-records/active", async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT pr.*, v.license_plate 
            FROM ParkingRecords pr
            JOIN Vehicles v ON pr.vehicle_id = v.vehicle_id
            WHERE pr.exit_time IS NULL
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error("Error fetching active parking records:", err);
        res.status(500).json({ error: err.message });
    }
});

//Calculate duration (in minutes) for a parking record by record_id
app.get("/parking-records/duration", async (req, res) => {
    const { record_id } = req.query;

    if (!record_id) {
        return res.status(400).json({ error: "Record ID is required" });
    }

    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input("record_id", sql.Int, record_id)
            .query("SELECT DATEDIFF(MINUTE, entry_time, exit_time) AS duration_minutes FROM ParkingRecords WHERE record_id = @record_id");

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "Parking record not found" });
        }

        res.json(result.recordset[0]);
    } catch (err) {
        console.error("Error calculating duration:", err);
        res.status(500).json({ error: err.message });
    }
});

//Delete a parking record by record_id
app.delete("/parking-records/delete", async (req, res) => {
    const { record_id } = req.body;

    if (!record_id) {
        return res.status(400).json({ error: "Record ID is required" });
    }

    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input("record_id", sql.Int, record_id)
            .query("DELETE FROM ParkingRecords WHERE record_id = @record_id");

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: "Record not found" });
        }

        res.status(200).json({ message: "Parking record deleted successfully" });
    } catch (err) {
        console.error("Error deleting record:", err);
        res.status(500).json({ error: err.message });
    }
});



//------------------------------------------Parking Tariffs-----------------------------------//
// View all tariffs
/*
app.get('/parkingTariffs', async (req, res) => {
   try {
        const pool = await sql.connect(config);
        const result = await pool.request().query("SELECT * FROM ParkingTariffs");
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error("Error fetching tariffs:", err);
        res.status(500).json({ error: err.message });
    }
});*/

// Get rates for a specific vehicle type and rate type
app.get('/parkingTariffs/rate', async (req, res) => {
    const { vehicle_type, rate_type } = req.query;
    
    if (!vehicle_type || !rate_type) {
        return res.status(400).json({ error: "Both vehicle_type and rate_type are required" });
    }
    
    try {
        const pool = await sql.connect(config);
        const query = `
            SELECT rate 
            FROM ParkingTariffs 
            WHERE vehicle_type = @vehicle_type 
              AND rate_type = @rate_type
            ORDER BY effective_date DESC
        `;
        
        const result = await pool.request()
            .input('vehicle_type', sql.VarChar, vehicle_type)
            .input('rate_type', sql.VarChar, rate_type)
            .query(query);
        
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error("Error fetching rate:", err);
        res.status(500).json({ error: err.message });
    }
});


//Add a new parking tariff
/*app.post("/parking-tariffs", async (req, res) => {
    const { vehicle_type, rate_type, rate } = req.body;

    if (!vehicle_type || !rate_type || rate === undefined) {
        return res.status(400).json({ error: "Vehicle type, rate type, and rate are required." });
    }

    try {
        const pool = await sql.connect(config);
        await pool.request()
            .input("vehicle_type", sql.VarChar(10), vehicle_type)
            .input("rate_type", sql.VarChar(10), rate_type)
            .input("rate", sql.Decimal(10, 2), rate)
            .query(`
                INSERT INTO ParkingTariffs (vehicle_type, rate_type, rate)
                VALUES (@vehicle_type, @rate_type, @rate)
            `);

        res.status(201).json({ message: "Tariff added successfully" });
    } catch (err) {
        console.error("Error adding tariff:", err);
        res.status(500).json({ error: err.message });
    }
});

//Get tariffs (optionally filtered by vehicle_type and rate_type)
app.get("/parking-tariffs", async (req, res) => {
    const { vehicle_type, rate_type } = req.query;

    let query = "SELECT * FROM ParkingTariffs";
    const conditions = [];
    const inputs = [];

    if (vehicle_type) {
        conditions.push("vehicle_type = @vehicle_type");
        inputs.push({ name: "vehicle_type", type: sql.VarChar, value: vehicle_type });
    }

    if (rate_type) {
        conditions.push("rate_type = @rate_type");
        inputs.push({ name: "rate_type", type: sql.VarChar, value: rate_type });
    }

    if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY effective_date DESC";

    try {
        const pool = await sql.connect(config);
        const request = pool.request();
        inputs.forEach(input => request.input(input.name, input.type, input.value));
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error("Error fetching tariffs:", err);
        res.status(500).json({ error: err.message });
    }
});


//Delete a parking tariff by ID
app.delete("/parking-tariffs/delete", async (req, res) => {
    const { tariff_id } = req.body;

    if (!tariff_id) {
        return res.status(400).json({ error: "Tariff ID is required" });
    }

    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input("tariff_id", sql.Int, tariff_id)
            .query("DELETE FROM ParkingTariffs WHERE tariff_id = @tariff_id");

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: "Tariff not found" });
        }

        res.status(200).json({ message: "Tariff deleted successfully" });
    } catch (err) {
        console.error("Error deleting tariff:", err);
        res.status(500).json({ error: err.message });
    }
});

// Update tariffs for all records matching a specific vehicle_type and rate_type
app.put("/parking-tariffs/update", async (req, res) => {
    const { vehicle_type, rate_type, rate } = req.body;

    if (!vehicle_type || !rate_type || rate === undefined) {
        return res.status(400).json({ error: "vehicle_type, rate_type, and rate are required." });
    }

    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input("vehicle_type", sql.VarChar(10), vehicle_type)
            .input("rate_type", sql.VarChar(10), rate_type)
            .input("rate", sql.Decimal(10, 2), rate)
            .query(`
                UPDATE ParkingTariffs
                SET rate = @rate,
                    effective_date = GETDATE()
                WHERE vehicle_type = @vehicle_type AND rate_type = @rate_type
            `);
            
        res.status(200).json({ 
            message: "Tariffs updated successfully", 
            rowsAffected: result.rowsAffected 
        });
    } catch (err) {
        console.error("Error updating tariffs:", err);
        res.status(500).json({ error: err.message });
    }
});
*/
// Get current rate for a specific vehicle type and rate type
app.get('/parkingTariffs/rate', async (req, res) => {
    const { vehicle_type, rate_type } = req.query;
    
    if (!vehicle_type || !rate_type) {
        return res.status(400).json({ error: "Both vehicle_type and rate_type are required" });
    }
    
    try {
        const pool = await sql.connect(config);
        const query = `
            SELECT TOP 1 rate 
            FROM ParkingTariffs 
            WHERE vehicle_type = @vehicle_type 
              AND rate_type = @rate_type
        `;
        
        const result = await pool.request()
            .input('vehicle_type', sql.VarChar, vehicle_type)
            .input('rate_type', sql.VarChar, rate_type)
            .query(query);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: "No matching tariff found" });
        }
        
        res.status(200).json(result.recordset[0]);
    } catch (err) {
        console.error("Error fetching rate:", err);
        res.status(500).json({ error: err.message });
    }
});

// Add a new parking tariff
app.post("/parking-tariffs", async (req, res) => {
    const { vehicle_type, rate_type, rate } = req.body;

    if (!vehicle_type || !rate_type || rate === undefined) {
        return res.status(400).json({ error: "Vehicle type, rate type, and rate are required." });
    }

    try {
        const pool = await sql.connect(config);
        
        // First check if tariff already exists
        const checkResult = await pool.request()
            .input("vehicle_type", sql.VarChar(10), vehicle_type)
            .input("rate_type", sql.VarChar(10), rate_type)
            .query("SELECT tariff_id FROM ParkingTariffs WHERE vehicle_type = @vehicle_type AND rate_type = @rate_type");
        
        if (checkResult.recordset.length > 0) {
            return res.status(400).json({ error: "Tariff for this vehicle type and rate type already exists" });
        }

        // Insert new tariff
        const insertResult = await pool.request()
            .input("vehicle_type", sql.VarChar(10), vehicle_type)
            .input("rate_type", sql.VarChar(10), rate_type)
            .input("rate", sql.Decimal(10, 2), rate)
            .query(`
                INSERT INTO ParkingTariffs (vehicle_type, rate_type, rate)
                VALUES (@vehicle_type, @rate_type, @rate)
            `);

        res.status(201).json({ 
            message: "Tariff added successfully",
            tariff_id: insertResult.recordset[0]?.tariff_id 
        });
    } catch (err) {
        console.error("Error adding tariff:", err);
        res.status(500).json({ error: err.message });
    }
});

// Get tariffs (optionally filtered by vehicle_type and rate_type)
app.get("/parking-tariffs", async (req, res) => {
    const { vehicle_type, rate_type } = req.query;

    let query = "SELECT * FROM ParkingTariffs";
    const conditions = [];
    const inputs = [];

    if (vehicle_type) {
        conditions.push("vehicle_type = @vehicle_type");
        inputs.push({ name: "vehicle_type", type: sql.VarChar(10), value: vehicle_type });
    }

    if (rate_type) {
        conditions.push("rate_type = @rate_type");
        inputs.push({ name: "rate_type", type: sql.VarChar(10), value: rate_type });
    }

    if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
    }

    try {
        const pool = await sql.connect(config);
        const request = pool.request();
        
        // Add all inputs
        inputs.forEach(input => request.input(input.name, input.type, input.value));
        
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error("Error fetching tariffs:", err);
        res.status(500).json({ error: err.message });
    }
});

// Delete a parking tariff by ID
app.delete("/parking-tariffs/:id", async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ error: "Tariff ID is required" });
    }

    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input("tariff_id", sql.Int, id)
            .query("DELETE FROM ParkingTariffs WHERE tariff_id = @tariff_id");

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: "Tariff not found" });
        }

        res.status(200).json({ message: "Tariff deleted successfully" });
    } catch (err) {
        console.error("Error deleting tariff:", err);
        
        // Handle foreign key constraint errors
        if (err.number === 547) {
            return res.status(400).json({ 
                error: "Cannot delete tariff as it's referenced in other records" 
            });
        }
        
        res.status(500).json({ error: err.message });
    }
});

// Update a specific tariff by ID
app.put("/parking-tariffs/:id", async (req, res) => {
    const { id } = req.params;
    const { rate } = req.body;

    if (!id || rate === undefined) {
        return res.status(400).json({ error: "Tariff ID and new rate are required." });
    }

    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input("tariff_id", sql.Int, id)
            .input("rate", sql.Decimal(10, 2), rate)
            .query(`
                UPDATE ParkingTariffs
                SET rate = @rate
                WHERE tariff_id = @tariff_id
            `);
            
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: "Tariff not found" });
        }
        
        res.status(200).json({ 
            message: "Tariff updated successfully", 
            rowsAffected: result.rowsAffected 
        });
    } catch (err) {
        console.error("Error updating tariff:", err);
        res.status(500).json({ error: err.message });
    }
});


//

// ------------------- PAYMENTS------------------- //
//View all payments
/*
app.get("/payments", async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query("SELECT * FROM Payments");
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error("Error fetching payments:", err);
        res.status(500).json({ error: err.message });
    }
});*/

//Get payments with record and vehicle information
app.get("/payments/details", async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const query = `
            SELECT p.*, pr.entry_time, pr.exit_time, v.license_plate
            FROM Payments p
            JOIN ParkingRecords pr ON p.record_id = pr.record_id
            JOIN Vehicles v ON pr.vehicle_id = v.vehicle_id
        `;
        const result = await pool.request().query(query);
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error("Error fetching payment details:", err);
        res.status(500).json({ error: err.message });
    }
});
/*app.get("/payments/user/:user_id", async (req, res) => {
    const user_id = req.params.user_id;

    try {
        const result = await pool.request()
            .input("user_id", sql.Int, user_id)
            .query(`
                SELECT p.*, m.plan_name, m.fee
                FROM Payments p
                LEFT JOIN UserMemberships um ON p.tariff_id = um.membership_id
                LEFT JOIN Memberships m ON um.membership_id = m.membership_id
                WHERE um.user_id = @user_id
            `);

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error("Error fetching payments:", err);
        res.status(500).json({ error: err.message });
    }
});
*/


//Get pending payments
/*
app.get("/payments/pending", async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const query = "SELECT * FROM Payments WHERE payment_status = 'Pending'";
        const result = await pool.request().query(query);
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error("Error fetching pending payments:", err);
        res.status(500).json({ error: err.message });
    }
});
*/

//Calculate total revenue generated (from paid payments)
app.get("/payments/revenue", async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const query = "SELECT SUM(amount) AS total_revenue FROM Payments WHERE payment_status = 'Paid'";
        const result = await pool.request().query(query);
        res.status(200).json(result.recordset[0]);  // returns { total_revenue: <value> }
    } catch (err) {
        console.error("Error calculating total revenue:", err);
        res.status(500).json({ error: err.message });
    }
});

//Add a new payment
app.post("/payments", async (req, res) => {
    const { record_id, tariff_id, amount, payment_status } = req.body;

    if (!record_id || amount === undefined) {
        return res.status(400).json({ error: "Record ID and amount are required." });
    }

    try {
        const pool = await sql.connect(config);
        await pool.request()
            .input("record_id", sql.Int, record_id)
            .input("tariff_id", tariff_id ? sql.Int : null, tariff_id || null)
            .input("amount", sql.Decimal(10, 2), amount)
            .input("payment_status", sql.VarChar(20), payment_status || 'Pending')
            .query(`
                INSERT INTO Payments (record_id, tariff_id, amount, payment_status)
                VALUES (@record_id, @tariff_id, @amount, @payment_status)
            `);

        res.status(201).json({ message: "Payment added successfully" });
    } catch (err) {
        console.error("Error adding payment:", err);
        res.status(500).json({ error: err.message });
    }
});

//Get all payments (optionally filter by payment_status)
app.get("/payments/all", async (req, res) => {
    const { status } = req.query;

    let query = "SELECT * FROM Payments";
    const inputs = [];

    if (status) {
        query += " WHERE payment_status = @status";
        inputs.push({ name: "status", type: sql.VarChar, value: status });
    }

    try {
        const pool = await sql.connect(config);
        const request = pool.request();
        inputs.forEach(input => request.input(input.name, input.type, input.value));
        const result = await request.query(query);
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error("Error fetching payments:", err);
        res.status(500).json({ error: err.message });
    }
});

//Delete payment by payment_id
app.delete("/payments/delete", async (req, res) => {
    const { payment_id } = req.body;

    if (!payment_id) {
        return res.status(400).json({ error: "Payment ID is required" });
    }

    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input("payment_id", sql.Int, payment_id)
            .query("DELETE FROM Payments WHERE payment_id = @payment_id");

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: "Payment not found" });
        }

        res.status(200).json({ message: "Payment deleted successfully" });
    } catch (err) {
        console.error("Error deleting payment:", err);
        res.status(500).json({ error: err.message });
    }
});
app.post("/payments", async (req, res) => {
    const { user_id, membership_id, amount, payment_status } = req.body;
  
    if (!user_id || !membership_id || !amount) {
      return res.status(400).json({ error: "User ID, Membership ID, and Amount are required." });
    }
  
    try {
      // Insert the payment into the Payments table
      const result = await pool.request()
        .input("user_id", sql.Int, user_id)
        .input("membership_id", sql.Int, membership_id)
        .input("amount", sql.Decimal(10, 2), amount)
        .input("payment_status", sql.VarChar(20), payment_status || 'Pending')
        .query(`
          INSERT INTO Payments (user_id, membership_id, amount, payment_status)
          VALUES (@user_id, @membership_id, @amount, @payment_status);
        `);
  
      res.status(201).json({ success: true, message: "Payment recorded successfully" });
    } catch (err) {
      console.error("Payment error:", err);
      res.status(500).json({ error: err.message });
    }
  });
  // Get payments for a user by user_id
  /*app.get("/payments/user/:user_id", async (req, res) => {
    const { user_id } = req.params;
  
    try {
      const result = await pool.request()
        .input("user_id", sql.Int, user_id)
        .query(`
          SELECT payment_id, amount, payment_status, created_at
          FROM Payments
          WHERE user_id = @user_id
          ORDER BY created_at DESC
        `);
  
      res.json(result.recordset);
    } catch (err) {
      console.error("Error fetching user payments:", err);
      res.status(500).json({ error: err.message });
    }
  });
  */
  



// ------------------- MEMBERSHIPS------------------- //
// View all membership plans
/*
app.get("/memberships", async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query("SELECT * FROM Memberships");
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error("Error fetching memberships:", err);
        res.status(500).json({ error: err.message });
    }
});

// Add new membership plan
app.post("/memberships", async (req, res) => {
    const { plan_name, fee, duration } = req.body;

    if (!plan_name || fee === undefined || !duration) {
        return res.status(400).json({ error: "Plan name, fee, and duration are required." });
    }

    try {
        const pool = await sql.connect(config);
        await pool.request()
            .input("plan_name", sql.VarChar(50), plan_name)
            .input("fee", sql.Decimal(10, 2), fee)
            .input("duration", sql.Int, duration)
            .query("INSERT INTO Memberships (plan_name, fee, duration) VALUES (@plan_name, @fee, @duration)");

        res.status(201).json({ message: "Membership plan added successfully" });
    } catch (err) {
        console.error("Error adding membership:", err);
        res.status(500).json({ error: err.message });
    }
});

// Delete a membership by ID
app.delete("/memberships/delete", async (req, res) => {
    const { membership_id } = req.body;

    if (!membership_id) {
        return res.status(400).json({ error: "Membership ID is required." });
    }

    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input("membership_id", sql.Int, membership_id)
            .query("DELETE FROM Memberships WHERE membership_id = @membership_id");

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: "Membership not found" });
        }

        res.status(200).json({ message: "Membership deleted successfully" });
    } catch (err) {
        console.error("Error deleting membership:", err);
        res.status(500).json({ error: err.message });
    }
});

// Update a membership plan by membership_id
app.put("/memberships/:membership_id", async (req, res) => {
    const { membership_id } = req.params;
    const { plan_name, fee, duration } = req.body;

    if (!plan_name || fee === undefined || !duration) {
        return res.status(400).json({ error: "Plan name, fee, and duration are required." });
    }

    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input("membership_id", sql.Int, membership_id)
            .input("plan_name", sql.VarChar(50), plan_name)
            .input("fee", sql.Decimal(10, 2), fee)
            .input("duration", sql.Int, duration)
            .query(`
                UPDATE Memberships
                SET plan_name = @plan_name,
                    fee = @fee,
                    duration = @duration
                WHERE membership_id = @membership_id
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: "Membership not found" });
        }

        res.status(200).json({ message: "Membership updated successfully" });
    } catch (err) {
        console.error("Error updating membership:", err);
        res.status(500).json({ error: err.message });
    }
});
*/


// View all membership plans (with optional filtering)
app.get("/memberships", async (req, res) => {
    const { plan_name, min_discount } = req.query;

    try {
        const pool = await sql.connect(config);
        let query = "SELECT * FROM Memberships";
        const conditions = [];
        const inputs = [];

        if (plan_name) {
            conditions.push("plan_name LIKE @plan_name");
            inputs.push({ name: "plan_name", type: sql.VarChar(50), value: `%${plan_name}%` });
        }

        if (min_discount) {
            conditions.push("discount >= @min_discount");
            inputs.push({ name: "min_discount", type: sql.Int, value: min_discount });
        }

        if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ");
        }

        const request = pool.request();
        inputs.forEach(input => request.input(input.name, input.type, input.value));
        
        const result = await request.query(query);
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error("Error fetching memberships:", err);
        res.status(500).json({ error: "Failed to fetch membership plans" });
    }
});

// Get single membership plan by ID
app.get("/memberships/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input("id", sql.Int, id)
            .query("SELECT * FROM Memberships WHERE membership_id = @id");

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: "Membership plan not found" });
        }

        res.status(200).json(result.recordset[0]);
    } catch (err) {
        console.error("Error fetching membership:", err);
        res.status(500).json({ error: "Failed to fetch membership plan" });
    }
});

// Add new membership plan
app.post("/memberships", async (req, res) => {
    const { plan_name, fee, duration, discount = 0 } = req.body;

    if (!plan_name || fee === undefined || duration === undefined) {
        return res.status(400).json({ 
            error: "Plan name, fee, and duration are required",
            required_fields: ["plan_name", "fee", "duration"]
        });
    }

    try {
        const pool = await sql.connect(config);
        
        // Check if plan name already exists
        const existingPlan = await pool.request()
            .input("plan_name", sql.VarChar(50), plan_name)
            .query("SELECT membership_id FROM Memberships WHERE plan_name = @plan_name");

        if (existingPlan.recordset.length > 0) {
            return res.status(409).json({ error: "Membership plan with this name already exists" });
        }

        // Insert new plan
        const result = await pool.request()
            .input("plan_name", sql.VarChar(50), plan_name)
            .input("fee", sql.Decimal(10, 2), fee)
            .input("duration", sql.Int, duration)
            .input("discount", sql.Int, discount)
            .query(`
                INSERT INTO Memberships (plan_name, fee, duration, discount)
                VALUES (@plan_name, @fee, @duration, @discount);
                SELECT SCOPE_IDENTITY() AS membership_id;
            `);

        res.status(201).json({ 
            message: "Membership plan added successfully",
            membership_id: result.recordset[0].membership_id,
            plan_name,
            fee,
            duration,
            discount
        });
    } catch (err) {
        console.error("Error adding membership:", err);
        res.status(500).json({ error: "Failed to add membership plan" });
    }
});

// Update a membership plan
app.put("/memberships/:id", async (req, res) => {
    const { id } = req.params;
    const { plan_name, fee, duration, discount } = req.body;

    if (!plan_name && fee === undefined && duration === undefined && discount === undefined) {
        return res.status(400).json({ 
            error: "At least one field to update is required",
            updatable_fields: ["plan_name", "fee", "duration", "discount"]
        });
    }

    try {
        const pool = await sql.connect(config);
        
        // Build dynamic update query
        let updateFields = [];
        const inputs = [
            { name: "id", type: sql.Int, value: id }
        ];

        if (plan_name) {
            updateFields.push("plan_name = @plan_name");
            inputs.push({ name: "plan_name", type: sql.VarChar(50), value: plan_name });
        }

        if (fee !== undefined) {
            updateFields.push("fee = @fee");
            inputs.push({ name: "fee", type: sql.Decimal(10, 2), value: fee });
        }

        if (duration !== undefined) {
            updateFields.push("duration = @duration");
            inputs.push({ name: "duration", type: sql.Int, value: duration });
        }

        if (discount !== undefined) {
            updateFields.push("discount = @discount");
            inputs.push({ name: "discount", type: sql.Int, value: discount });
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: "No valid fields provided for update" });
        }

        const query = `
            UPDATE Memberships
            SET ${updateFields.join(", ")}
            WHERE membership_id = @id
        `;

        const request = pool.request();
        inputs.forEach(input => request.input(input.name, input.type, input.value));
        
        const result = await request.query(query);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: "Membership plan not found" });
        }

        res.status(200).json({ 
            message: "Membership plan updated successfully",
            updated_fields: updateFields.map(f => f.split(" = ")[0])
        });
    } catch (err) {
        console.error("Error updating membership:", err);
        res.status(500).json({ error: "Failed to update membership plan" });
    }
});

// Delete a membership plan
app.delete("/memberships/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await sql.connect(config);
        
        // First check if membership is being used
        const inUse = await pool.request()
            .input("id", sql.Int, id)
            .query("SELECT TOP 1 user_membership_id FROM UserMemberships WHERE membership_id = @id");

        if (inUse.recordset.length > 0) {
            return res.status(400).json({ 
                error: "Cannot delete membership plan as it's currently in use",
                solution: "Update existing user memberships first"
            });
        }

        // Delete the plan
        const result = await pool.request()
            .input("id", sql.Int, id)
            .query("DELETE FROM Memberships WHERE membership_id = @id");

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: "Membership plan not found" });
        }

        res.status(200).json({ message: "Membership plan deleted successfully" });
    } catch (err) {
        console.error("Error deleting membership:", err);
        
        if (err.number === 547) { // Foreign key constraint error
            return res.status(400).json({ 
                error: "Cannot delete membership plan as it's referenced in other records",
                solution: "Remove all references to this plan first"
            });
        }
        
        res.status(500).json({ error: "Failed to delete membership plan" });
    }
});

  


//----------------------User Memeberships----------------------//
// View user memberships (membership details with user name and plan name)
app.get("/user-memberships", async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const query = `
            SELECT um.*, u.name, m.plan_name
            FROM UserMemberships um
            JOIN Users u ON um.user_id = u.user_id
            JOIN Memberships m ON um.membership_id = m.membership_id
        `;
        const result = await pool.request().query(query);
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error("Error fetching user memberships:", err);
        res.status(500).json({ error: err.message });
    }
});

// View currently active user memberships
app.get("/user-memberships/active", async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const query = `
            SELECT * FROM UserMemberships
            WHERE start_date <= GETDATE() AND end_date >= GETDATE()
        `;
        const result = await pool.request().query(query);
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error("Error fetching active memberships:", err);
        res.status(500).json({ error: err.message });
    }
});

// Assign a user a membership
app.post("/user-memberships", async (req, res) => {
    const { user_id, membership_id, start_date, end_date } = req.body;

    if (!user_id || !membership_id || !start_date || !end_date) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const pool = await sql.connect(config);
        await pool.request()
            .input("user_id", sql.Int, user_id)
            .input("membership_id", sql.Int, membership_id)
            .input("start_date", sql.Date, start_date)
            .input("end_date", sql.Date, end_date)
            .query(`
                INSERT INTO UserMemberships (user_id, membership_id, start_date, end_date)
                VALUES (@user_id, @membership_id, @start_date, @end_date)
            `);

        res.status(201).json({ message: "User membership added successfully" });
    } catch (err) {
        console.error("Error assigning membership:", err);
        res.status(500).json({ error: err.message });
    }
});

// Delete user membership
app.delete("/user-memberships/delete", async (req, res) => {
    const { user_membership_id } = req.body;

    if (!user_membership_id) {
        return res.status(400).json({ error: "User Membership ID is required" });
    }

    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input("user_membership_id", sql.Int, user_membership_id)
            .query("DELETE FROM UserMemberships WHERE user_membership_id = @user_membership_id");

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: "User membership not found" });
        }

        res.status(200).json({ message: "User membership deleted successfully" });
    } catch (err) {
        console.error("Error deleting user membership:", err);
        res.status(500).json({ error: err.message });
    }
});

// Update a user membership by user_membership_id
app.put("/user-memberships/:user_membership_id", async (req, res) => {
    const { user_membership_id } = req.params;
    const { membership_id, start_date, end_date } = req.body;

    if (!membership_id || !start_date || !end_date) {
        return res.status(400).json({ error: "Membership ID, start date, and end date are required." });
    }

    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input("user_membership_id", sql.Int, user_membership_id)
            .input("membership_id", sql.Int, membership_id)
            .input("start_date", sql.Date, start_date)
            .input("end_date", sql.Date, end_date)
            .query(`
                UPDATE UserMemberships
                SET membership_id = @membership_id,
                    start_date = @start_date,
                    end_date = @end_date
                WHERE user_membership_id = @user_membership_id
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: "User membership not found" });
        }

        res.status(200).json({ message: "User membership updated successfully" });
    } catch (err) {
        console.error("Error updating user membership:", err);
        res.status(500).json({ error: err.message });
    }
});


//------------------------------------------Penalties-----------------------------------//
// View all penalties (optional filter by status)
app.get("/penalties", async (req, res) => {
    const { status } = req.query;
    
    let query = `
        SELECT 
            p.penalty_id,
            p.record_id,
            p.penalty_amount,
            p.reason,
            p.penalty_status,
            v.license_plate
        FROM Penalties p
        JOIN ParkingRecords pr ON p.record_id = pr.record_id
        JOIN Vehicles v ON pr.vehicle_id = v.vehicle_id
    `;

    const inputs = [];

    if (status) {
        query += " WHERE p.penalty_status = @status";
        inputs.push({ name: "status", type: sql.VarChar, value: status });
    }

    try {
        const pool = await sql.connect(config);
        const request = pool.request();
        inputs.forEach(i => request.input(i.name, i.type, i.value));
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error("Error fetching penalties:", err);
        res.status(500).json({ error: err.message });
    }
});


/*
// View unpaid penalties
app.get("/penalties/unpaid", async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query("SELECT * FROM Penalties WHERE penalty_status = 'Unpaid'");
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error("Error fetching unpaid penalties:", err);
        res.status(500).json({ error: err.message });
    }
});
*/

// View penalties along with vehicle info
app.get("/penalties/details", async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const query = `
            SELECT p.*, v.license_plate
            FROM Penalties p
            JOIN ParkingRecords pr ON p.record_id = pr.record_id
            JOIN Vehicles v ON pr.vehicle_id = v.vehicle_id
        `;
        const result = await pool.request().query(query);
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error("Error fetching penalties with details:", err);
        res.status(500).json({ error: err.message });
    }
});

// Add a new penalty
app.post("/penalties", async (req, res) => {
    const { record_id, penalty_amount, reason, penalty_status } = req.body;

    if (!record_id || penalty_amount === undefined) {
        return res.status(400).json({ error: "Record ID and penalty amount are required." });
    }

    try {
        const pool = await sql.connect(config);
        await pool.request()
            .input("record_id", sql.Int, record_id)
            .input("penalty_amount", sql.Decimal(10, 2), penalty_amount)
            .input("reason", sql.VarChar(100), reason || null)
            .input("penalty_status", sql.VarChar(10), penalty_status || 'Unpaid')
            .query(`
                INSERT INTO Penalties (record_id, penalty_amount, reason, penalty_status)
                VALUES (@record_id, @penalty_amount, @reason, @penalty_status)
            `);

        res.status(201).json({ message: "Penalty added successfully" });
    } catch (err) {
        console.error("Error adding penalty:", err);
        res.status(500).json({ error: err.message });
    }
});

// Delete penalty by ID
app.delete("/penalties/delete", async (req, res) => {
    const { penalty_id } = req.body;

    if (!penalty_id) {
        return res.status(400).json({ error: "Penalty ID is required" });
    }

    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input("penalty_id", sql.Int, penalty_id)
            .query("DELETE FROM Penalties WHERE penalty_id = @penalty_id");

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: "Penalty not found" });
        }

        res.status(200).json({ message: "Penalty deleted successfully" });
    } catch (err) {
        console.error("Error deleting penalty:", err);
        res.status(500).json({ error: err.message });
    }
});


app.get("/penalties/user/:user_id", async (req, res) => {
    const { user_id } = req.params;
  
    try {
      const result = await pool.request()
        .input("user_id", sql.Int, user_id)
        .query(`
          SELECT p.*, pr.entry_time, pr.exit_time, v.license_plate
          FROM Penalties p
          JOIN ParkingRecords pr ON p.record_id = pr.record_id
          JOIN Bookings b ON b.booking_id = pr.booking_id
          JOIN UserVehicles uv ON uv.user_vehicle_id = b.user_vehicle_id
          JOIN Vehicles v ON uv.vehicle_id = v.vehicle_id
          WHERE uv.user_id = @user_id
        `);
  
      res.status(200).json(result.recordset);
    } catch (err) {
      console.error("❌ Error fetching user penalties:", err);
      res.status(500).json({ error: err.message });
    }
  });
  

  app.put("/penalties/pay/:penalty_id", async (req, res) => {
    const { penalty_id } = req.params;
  
    try {
      const result = await pool.request()
        .input("penalty_id", sql.Int, penalty_id)
        .query(`
          UPDATE Penalties
          SET penalty_status = 'Paid'
          WHERE penalty_id = @penalty_id
        `);
  
      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ error: "Penalty not found" });
      }
  
      res.status(200).json({ message: "✅ Penalty marked as paid" });
    } catch (err) {
      console.error("❌ Error updating penalty status:", err);
      res.status(500).json({ error: err.message });
    }
  });
  

app.post("/login", async (req, res) => {
    const { email, password, isAdmin } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
    }

    try {
        const result = await pool.request()
            .input("email", sql.VarChar, email)
            .query(`
                SELECT user_id, name, password, role 
                FROM Users 
                WHERE email = @email
            `);

        if (result.recordset.length === 0) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const user = result.recordset[0];
        
        // Directly compare the password
        if (password !== user.password) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Check if admin login attempt matches role
        if (isAdmin && user.role !== 'admin') {
            return res.status(403).json({ error: "Admin access denied" });
        }

        res.json({ 
            success: true, 
            user_id: user.user_id,
            name: user.name,
            role: user.role
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
//const jwt = require('jsonwebtoken'); // Import jwt

/*app.post("/login", async (req, res) => {
    const { email, password, isAdmin } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
    }

    try {
        const result = await pool.request()
            .input("email", sql.VarChar, email)
            .query(`
                SELECT user_id, name, password, role 
                FROM Users 
                WHERE email = @email
            `);

        if (result.recordset.length === 0) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const user = result.recordset[0];
        
        // Directly compare the password
        if (password !== user.password) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Check if admin login attempt matches role
        if (isAdmin && user.role !== 'admin') {
            return res.status(403).json({ error: "Admin access denied" });
        }

        // Generate JWT Token
        const token = jwt.sign(
            { userId: user.user_id, role: user.role }, // payload with user data
            process.env.JWT_SECRET, // secret key (store it securely)
            { expiresIn: '1h' } // token expiration time
        );

        res.json({ 
            success: true, 
            user_id: user.user_id,
            name: user.name,
            role: user.role,
            token: token // Return the token in the response
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});*/






app.post("/signup", async (req, res) => {
    const { name, email, contact_number, password, vehicle_type, license_plate } = req.body;

    if (!name || !email || !contact_number || !password || !vehicle_type || !license_plate) {
      return res.status(400).json({ error: "All fields are required" });
    }

    try {
      // Insert into Users table
      const result = await pool.request()
        .input('name', sql.VarChar, name)
        .input('email', sql.VarChar, email)
        .input('contact_number', sql.VarChar, contact_number)
        .input('password', sql.VarChar, password)  // In production, hash passwords
        .query(`
          INSERT INTO Users (name, email, contact_number, password)
          VALUES (@name, @email, @contact_number, @password);
          SELECT SCOPE_IDENTITY() AS user_id;
        `);

      const userId = result.recordset[0].user_id; // Get the user_id

      // Insert into Vehicles table
      const vehicleResult = await pool.request()
        .input('vehicle_type', sql.VarChar, vehicle_type)
        .input('license_plate', sql.VarChar, license_plate)
        .query(`
          INSERT INTO Vehicles (vehicle_type, license_plate)
          VALUES (@vehicle_type, @license_plate);
          SELECT SCOPE_IDENTITY() AS vehicle_id;
        `);

      const vehicleId = vehicleResult.recordset[0].vehicle_id; // Get the vehicle_id

      // Insert into UserVehicles table to link the user and the vehicle
      await pool.request()
        .input('user_id', sql.Int, userId)
        .input('vehicle_id', sql.Int, vehicleId)
        .query(`
          INSERT INTO UserVehicles (user_id, vehicle_id)
          VALUES (@user_id, @vehicle_id);
        `);

      res.status(201).json({ success: true, message: "Account created successfully!" });

    } catch (err) {
      console.error("Signup failed:", err);
      res.status(500).json({ error: err.message });
    }
});

/*app.post('/select-membership', async (req, res) => {
    const { user_id, membership_id } = req.body;
  
    if (!user_id || !membership_id) {
      return res.status(400).json({ error: "User ID and Membership ID are required" });
    }
  
    try {
      // Step 1: Check for existing active membership
      const checkActive = await pool.request()
        .input("user_id", sql.Int, user_id)
        .query(`
          SELECT * FROM UserMemberships 
          WHERE user_id = @user_id 
            AND GETDATE() BETWEEN start_date AND end_date
        `);
  
      if (checkActive.recordset.length > 0) {
        return res.status(400).json({
          error: "You already have an active membership",
          plan: checkActive.recordset[0].membership_id
        });
      }
  
      // Step 2: Fetch membership fee and duration
      const result = await pool.request()
        .input('membership_id', sql.Int, membership_id)
        .query(`SELECT fee, duration FROM Memberships WHERE membership_id = @membership_id`);
  
      if (result.recordset.length === 0) {
        return res.status(404).json({ error: "Membership plan not found" });
      }
  
      const { fee, duration } = result.recordset[0];
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + duration);
  
      // Step 3: Insert into UserMemberships
      await pool.request()
        .input("user_id", sql.Int, user_id)
        .input("membership_id", sql.Int, membership_id)
        .input("start_date", sql.Date, startDate)
        .input("end_date", sql.Date, endDate)
        .query(`
          INSERT INTO UserMemberships (user_id, membership_id, start_date, end_date)
          VALUES (@user_id, @membership_id, @start_date, @end_date)
        `);
  
      // Step 4: Add payment to MembershipPayments
      await pool.request()
        .input("user_id", sql.Int, user_id)
        .input("membership_id", sql.Int, membership_id)
        .input("amount", sql.Decimal(10, 2), fee)
        .input("payment_status", sql.VarChar, "Paid")
        .query(`
          INSERT INTO MembershipPayments (user_id, membership_id, amount, payment_status)
          VALUES (@user_id, @membership_id, @amount, @payment_status)
        `);
  
      res.status(201).json({ message: "✅ Membership selected and payment recorded" });
    } catch (err) {
      console.error("Membership selection error:", err);
      res.status(500).json({ error: err.message });
    }
  });
  */
// ✅ BACKEND: Update /select-membership API
app.post("/select-membership", async (req, res) => {
    const { user_id, membership_id } = req.body;

    if (!user_id || !membership_id) {
        return res.status(400).json({ error: "user_id and membership_id are required" });
    }

    try {
        // 1. Check if user already has an active membership
        const activeCheck = await pool.request()
            .input("user_id", sql.Int, user_id)
            .query(`
                SELECT * FROM UserMemberships
                WHERE user_id = @user_id
                AND start_date <= GETDATE()
                AND end_date >= GETDATE()
            `);

        if (activeCheck.recordset.length > 0) {
            return res.status(409).json({ error: "User already has an active membership" });
        }

        // 2. Fetch membership plan details
        const planResult = await pool.request()
            .input("membership_id", sql.Int, membership_id)
            .query("SELECT fee, duration FROM Memberships WHERE membership_id = @membership_id");

        if (planResult.recordset.length === 0) {
            return res.status(404).json({ error: "Membership plan not found" });
        }

        const { fee, duration } = planResult.recordset[0];
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + duration);

        // 3. Insert into UserMemberships
        await pool.request()
            .input("user_id", sql.Int, user_id)
            .input("membership_id", sql.Int, membership_id)
            .input("start_date", sql.Date, startDate)
            .input("end_date", sql.Date, endDate)
            .query(`
                INSERT INTO UserMemberships (user_id, membership_id, start_date, end_date)
                VALUES (@user_id, @membership_id, @start_date, @end_date)
            `);

        // 4. Insert payment into MembershipPayments
        await pool.request()
            .input("user_id", sql.Int, user_id)
            .input("membership_id", sql.Int, membership_id)
            .input("amount", sql.Decimal(10, 2), fee)
            .input("payment_status", sql.VarChar(20), "Paid")
            .query(`
                INSERT INTO MembershipPayments (user_id, membership_id, amount, payment_status)
                VALUES (@user_id, @membership_id, @amount, @payment_status)
            `);

        res.status(201).json({ message: "Membership and payment recorded successfully" });

    } catch (err) {
        console.error("Membership selection failed:", err);
        res.status(500).json({ error: err.message });
    }
});





/*app.post("/book-and-pay", async (req, res) => {
    const { user_vehicle_id, slot_id, booking_start_time, booking_end_time } = req.body;
  
    if (!user_vehicle_id || !slot_id || !booking_start_time || !booking_end_time) {
      return res.status(400).json({ error: "Missing required fields" });
    }
  
    try {
      const start = new Date(booking_start_time);
      const end = new Date(booking_end_time);
      const durationHours = Math.ceil((end - start) / (1000 * 60 * 60));
  
      if (durationHours <= 0) {
        return res.status(400).json({ error: "Invalid booking time range" });
      }
  
      // 1. Check for overlapping bookings, excluding cancelled ones
      const overlapCheck = await pool.request()
        .input("slot_id", sql.Int, slot_id)
        .input("start", sql.DateTime, start)
        .input("end", sql.DateTime, end)
        .query(`
          SELECT 1 FROM Bookings
          WHERE slot_id = @slot_id
            AND booking_start_time < @end
            AND booking_end_time > @start
            AND status != 'Cancelled'
        `);
  
      if (overlapCheck.recordset.length > 0) {
        return res.status(400).json({ error: "❌ Slot already booked for this time range." });
      }
  
      // 2. Get vehicle and user info
      const vehicleResult = await pool.request()
        .input("user_vehicle_id", sql.Int, user_vehicle_id)
        .query(`
          SELECT v.vehicle_id, v.vehicle_type, uv.user_id 
          FROM UserVehicles uv
          JOIN Vehicles v ON uv.vehicle_id = v.vehicle_id
          WHERE uv.user_vehicle_id = @user_vehicle_id
        `);
  
      const { vehicle_id, vehicle_type, user_id } = vehicleResult.recordset[0];
  
      // 3. Get hourly rate
      const tariffResult = await pool.request()
        .input("vehicle_type", sql.VarChar, vehicle_type)
        .query("SELECT TOP 1 tariff_id, rate FROM ParkingTariffs WHERE vehicle_type = @vehicle_type");
  
      const { tariff_id, rate } = tariffResult.recordset[0];
      let totalAmount = parseFloat(rate) * durationHours;
  
      // 4. Apply membership discount if active
      const membershipResult = await pool.request()
        .input("user_id", sql.Int, user_id)
        .query(`
          SELECT TOP 1 m.discount
          FROM UserMemberships um
          JOIN Memberships m ON um.membership_id = m.membership_id
          WHERE um.user_id = @user_id 
            AND um.start_date <= GETDATE() 
            AND um.end_date >= GETDATE()
          ORDER BY um.end_date DESC
        `);
  
      if (membershipResult.recordset.length > 0) {
        const discount = membershipResult.recordset[0].discount;
        totalAmount -= (totalAmount * discount / 100);
      }
  
      // 5. Insert booking
      const bookingInsert = await pool.request()
        .input("user_vehicle_id", sql.Int, user_vehicle_id)
        .input("slot_id", sql.Int, slot_id)
        .input("booking_start_time", sql.DateTime, start)
        .input("booking_end_time", sql.DateTime, end)
        .input("tariff_id", sql.Int, tariff_id)
        .query(`
          INSERT INTO Bookings (user_vehicle_id, slot_id, booking_start_time, booking_end_time, tariff_id)
          OUTPUT INSERTED.booking_id
          VALUES (@user_vehicle_id, @slot_id, @booking_start_time, @booking_end_time, @tariff_id)
        `);
  
      const booking_id = bookingInsert.recordset[0].booking_id;
  
      // 6. Insert parking record
      const parkingInsert = await pool.request()
        .input("vehicle_id", sql.Int, vehicle_id)
        .input("slot_id", sql.Int, slot_id)
        .input("entry_time", sql.DateTime, start)
        .input("exit_time", sql.DateTime, end)
        .input("booking_id", sql.Int, booking_id)
        .query(`
          INSERT INTO ParkingRecords (vehicle_id, slot_id, entry_time, exit_time, booking_id)
          OUTPUT INSERTED.record_id
          VALUES (@vehicle_id, @slot_id, @entry_time, @exit_time, @booking_id)
        `);
  
      const record_id = parkingInsert.recordset[0].record_id;
  
      // 7. Insert payment
      await pool.request()
        .input("record_id", sql.Int, record_id)
        .input("tariff_id", sql.Int, tariff_id)
        .input("amount", sql.Decimal(10, 2), totalAmount)
        .input("payment_status", sql.VarChar, "Paid")
        .query(`
          INSERT INTO Payments (record_id, tariff_id, amount, payment_status)
          VALUES (@record_id, @tariff_id, @amount, @payment_status)
        `);
  
      res.status(200).json({
        message: "✅ Booking & Payment Successful",
        booking_id,
        record_id,
        price: totalAmount
      });
  
    } catch (err) {
      console.error("❌ Booking & Payment Error:", err);
      res.status(500).json({ error: err.message });
    }
  });
  */

// ✅ UPDATED BACKEND API (Node.js Express)

app.post("/book-and-pay", async (req, res) => {
    const { user_vehicle_id, slot_id, booking_start_time, booking_end_time } = req.body;
  
    if (!user_vehicle_id || !slot_id || !booking_start_time || !booking_end_time) {
      return res.status(400).json({ error: "Missing required fields" });
    }
  
    try {
      const start = new Date(booking_start_time);
      const end = new Date(booking_end_time);
      const durationHours = Math.ceil((end - start) / (1000 * 60 * 60));
  
      if (durationHours <= 0) {
        return res.status(400).json({ error: "Invalid booking time range" });
      }
  
      // 1. Check for overlapping bookings, excluding cancelled
      const overlapCheck = await pool.request()
        .input("slot_id", sql.Int, slot_id)
        .input("start", sql.DateTime, start)
        .input("end", sql.DateTime, end)
        .query(`
          SELECT 1 FROM Bookings
          WHERE slot_id = @slot_id
            AND booking_start_time < @end
            AND booking_end_time > @start
            AND status != 'Cancelled'
        `);
  
      if (overlapCheck.recordset.length > 0) {
        return res.status(400).json({ error: "❌ Slot already booked for this time range." });
      }
  
      // 2. Get vehicle and user info
      const vehicleResult = await pool.request()
        .input("user_vehicle_id", sql.Int, user_vehicle_id)
        .query(`
          SELECT v.vehicle_id, v.vehicle_type, uv.user_id 
          FROM UserVehicles uv
          JOIN Vehicles v ON uv.vehicle_id = v.vehicle_id
          WHERE uv.user_vehicle_id = @user_vehicle_id
        `);
  
      const { vehicle_id, vehicle_type, user_id } = vehicleResult.recordset[0];
  
      // ✅ NEW: Check for active bookings count
      const activeBookings = await pool.request()
        .input("user_id", sql.Int, user_id)
        .query(`
          SELECT COUNT(*) AS count
          FROM Bookings b
          JOIN UserVehicles uv ON b.user_vehicle_id = uv.user_vehicle_id
          WHERE uv.user_id = @user_id AND b.status = 'Confirmed'
        `);
  
      if (activeBookings.recordset[0].count >= 3) {
        return res.status(400).json({ error: "❌ You already have 3 active bookings." });
      }
  
      // 3. Get hourly rate
      const tariffResult = await pool.request()
        .input("vehicle_type", sql.VarChar, vehicle_type)
        .query("SELECT TOP 1 tariff_id, rate FROM ParkingTariffs WHERE vehicle_type = @vehicle_type");
  
      const { tariff_id, rate } = tariffResult.recordset[0];
      let totalAmount = parseFloat(rate) * durationHours;
  
      // 4. Membership discount
      const membershipResult = await pool.request()
        .input("user_id", sql.Int, user_id)
        .query(`
          SELECT TOP 1 m.discount
          FROM UserMemberships um
          JOIN Memberships m ON um.membership_id = m.membership_id
          WHERE um.user_id = @user_id AND um.start_date <= GETDATE() AND um.end_date >= GETDATE()
        `);
  
      if (membershipResult.recordset.length > 0) {
        const discount = membershipResult.recordset[0].discount;
        totalAmount -= (totalAmount * discount / 100);
      }
  
      // 5. Insert booking
      const bookingInsert = await pool.request()
        .input("user_vehicle_id", sql.Int, user_vehicle_id)
        .input("slot_id", sql.Int, slot_id)
        .input("booking_start_time", sql.DateTime, start)
        .input("booking_end_time", sql.DateTime, end)
        .input("tariff_id", sql.Int, tariff_id)
        .query(`
          INSERT INTO Bookings (user_vehicle_id, slot_id, booking_start_time, booking_end_time, tariff_id)
          OUTPUT INSERTED.booking_id
          VALUES (@user_vehicle_id, @slot_id, @booking_start_time, @booking_end_time, @tariff_id)
        `);
  
      const booking_id = bookingInsert.recordset[0].booking_id;
  
      // 6. Insert parking record
      const parkingInsert = await pool.request()
        .input("vehicle_id", sql.Int, vehicle_id)
        .input("slot_id", sql.Int, slot_id)
        .input("entry_time", sql.DateTime, start)
        .input("exit_time", sql.DateTime, end)
        .input("booking_id", sql.Int, booking_id)
        .query(`
          INSERT INTO ParkingRecords (vehicle_id, slot_id, entry_time, exit_time, booking_id)
          OUTPUT INSERTED.record_id
          VALUES (@vehicle_id, @slot_id, @entry_time, @exit_time, @booking_id)
        `);
  
      const record_id = parkingInsert.recordset[0].record_id;
  
      // 7. Insert payment
      await pool.request()
        .input("record_id", sql.Int, record_id)
        .input("tariff_id", sql.Int, tariff_id)
        .input("amount", sql.Decimal(10, 2), totalAmount)
        .input("payment_status", sql.VarChar, "Paid")
        .query(`
          INSERT INTO Payments (record_id, tariff_id, amount, payment_status)
          VALUES (@record_id, @tariff_id, @amount, @payment_status)
        `);
  
      res.status(200).json({
        message: "✅ Booking & Payment Successful",
        booking_id,
        record_id,
        price: totalAmount
      });
    } catch (err) {
      console.error("❌ Booking & Payment Error:", err);
      res.status(500).json({ error: err.message });
    }
  });
  



  

  app.post("/cancel-booking", async (req, res) => {
    const { booking_id } = req.body;
  
    if (!booking_id) {
      return res.status(400).json({ error: "booking_id is required" });
    }
  
    try {
      // 1. Update booking status
      await pool.request()
        .input("booking_id", sql.Int, booking_id)
        .query(`
          UPDATE Bookings
          SET status = 'Cancelled'
          WHERE booking_id = @booking_id
        `);
  
      // 2. Get related parking record ID (if any)
      const parkingResult = await pool.request()
        .input("booking_id", sql.Int, booking_id)
        .query(`
          SELECT record_id FROM ParkingRecords
          WHERE booking_id = @booking_id
        `);
  
      if (parkingResult.recordset.length > 0) {
        const recordId = parkingResult.recordset[0].record_id;
  
        // 3. Delete corresponding Payment (if any)
        await pool.request()
          .input("record_id", sql.Int, recordId)
          .query(`DELETE FROM Payments WHERE record_id = @record_id`);
  
        // 4. Delete ParkingRecord
        await pool.request()
          .input("record_id", sql.Int, recordId)
          .query(`DELETE FROM ParkingRecords WHERE record_id = @record_id`);
      }
  
      res.status(200).json({ message: "✅ Booking cancelled and associated records removed" });
    } catch (err) {
      console.error("❌ Error cancelling booking:", err);
      res.status(500).json({ error: "Failed to cancel booking and clean up" });
    }
  });
  
  




  app.get('/payments/user/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId);
  
    try {
      const result = await pool.request()
        .input("user_id", sql.Int, userId)
        .query(`
          SELECT 
            p.payment_id,
            v.license_plate,
            p.amount,
            p.payment_status,
            b.booking_start_time AS entry_time,
            b.booking_end_time AS exit_time
          FROM Payments p
          JOIN ParkingRecords pr ON p.record_id = pr.record_id
          JOIN Bookings b ON pr.booking_id = b.booking_id
          JOIN UserVehicles uv ON b.user_vehicle_id = uv.user_vehicle_id
          JOIN Vehicles v ON uv.vehicle_id = v.vehicle_id
          WHERE uv.user_id = @user_id
          ORDER BY p.payment_id DESC;
        `);
  
      res.status(200).json(result.recordset);
    } catch (err) {
      console.error("❌ Error fetching user payments:", err);
      res.status(500).json({ error: "Failed to fetch user payments." });
    }
  });


  app.post("/cancel-membership", async (req, res) => {
    const { user_id } = req.body;
  
    if (!user_id) {
      return res.status(400).json({ error: "User ID is required" });
    }
  
    try {
      // 1. Fetch the active membership
      const result = await pool.request()
        .input("user_id", sql.Int, user_id)
        .query(`
          SELECT membership_id FROM UserMemberships 
          WHERE user_id = @user_id AND GETDATE() BETWEEN start_date AND end_date
        `);
  
      if (result.recordset.length === 0) {
        return res.status(404).json({ error: "No active membership found to cancel" });
      }
  
      const membershipId = result.recordset[0].membership_id;
  
      // 2. Delete from MembershipPayments first
      await pool.request()
        .input("user_id", sql.Int, user_id)
        .input("membership_id", sql.Int, membershipId)
        .query(`
          DELETE FROM MembershipPayments 
          WHERE user_id = @user_id AND membership_id = @membership_id
        `);
  
      // 3. Delete from UserMemberships
      await pool.request()
        .input("user_id", sql.Int, user_id)
        .input("membership_id", sql.Int, membershipId)
        .query(`
          DELETE FROM UserMemberships 
          WHERE user_id = @user_id AND membership_id = @membership_id
        `);
  
      res.status(200).json({ message: "✅ Membership and associated payment cancelled successfully" });
  
    } catch (err) {
      console.error("❌ Error cancelling membership:", err);
      res.status(500).json({ error: "Failed to cancel membership and remove payment" });
    }
  });
  