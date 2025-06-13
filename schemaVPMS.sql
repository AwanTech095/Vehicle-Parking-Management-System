CREATE DATABASE VehicleManagement;
USE VehicleManagement;

-- Base Tables (No Dependencies)
CREATE TABLE Users (
    user_id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact_number VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at DATETIME DEFAULT GETDATE()
);


CREATE TABLE ParkingTariffs (
    tariff_id INT IDENTITY(1,1) PRIMARY KEY,
    vehicle_type VARCHAR(10) CHECK (vehicle_type IN ('Car','Bike')) NOT NULL,
    rate_type VARCHAR(10) CHECK (rate_type IN ('Hourly')) NOT NULL,
    rate DECIMAL(10, 2) NOT NULL CHECK (rate >= 0)
);

CREATE TABLE Memberships (
    membership_id INT IDENTITY(1,1) PRIMARY KEY,
    plan_name VARCHAR(50) UNIQUE,
    fee DECIMAL(10, 2) NOT NULL,
    duration INT, -- Duration in days
    discount INT
);

-- Independent Vehicle table (no FKs)
CREATE TABLE Vehicles (
    vehicle_id INT IDENTITY(1,1) PRIMARY KEY,
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    vehicle_type VARCHAR(10) CHECK (vehicle_type IN ('Car','Bike','Other')) NOT NULL
);

-- User-Vehicle relationship with single CASCADE
CREATE TABLE UserVehicles (
    user_vehicle_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES Vehicles(vehicle_id) ON DELETE NO ACTION,
    UNIQUE (user_id, vehicle_id)
);

CREATE TABLE ParkingSlots (
    slot_id INT IDENTITY(1,1) PRIMARY KEY,
    slot_number VARCHAR(10) UNIQUE NOT NULL,
    vehicle_type VARCHAR(10) CHECK (vehicle_type IN ('Car','Bike', 'Other')) NOT NULL,
    status VARCHAR(10) CHECK (status IN ('Available','Occupied','Reserved')) DEFAULT 'Available'
);

-- Bookings with single CASCADE path
CREATE TABLE Bookings (
    booking_id INT IDENTITY(1,1) PRIMARY KEY,
    user_vehicle_id INT NOT NULL,
    slot_id INT NOT NULL,
    booking_start_time DATETIME NOT NULL,
    booking_end_time DATETIME NOT NULL,
    tariff_id INT,
    status VARCHAR(20) CHECK (status IN ('Confirmed','No-Show','Cancelled','Completed')) DEFAULT 'Confirmed',
    created_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT chk_booking_times CHECK (booking_start_time < booking_end_time),
    FOREIGN KEY (tariff_id) REFERENCES ParkingTariffs(tariff_id) ON DELETE SET NULL,
    FOREIGN KEY (user_vehicle_id) REFERENCES UserVehicles(user_vehicle_id) ON DELETE CASCADE,
    FOREIGN KEY (slot_id) REFERENCES ParkingSlots(slot_id) ON DELETE NO ACTION
);

-- ParkingRecords with single CASCADE path
CREATE TABLE ParkingRecords (
    record_id INT IDENTITY(1,1) PRIMARY KEY,
    booking_id INT NULL,  -- Nullable for walk-ins
    vehicle_id INT NOT NULL,
    slot_id INT NOT NULL,
    entry_time DATETIME NOT NULL,
    exit_time DATETIME NULL,
    FOREIGN KEY (booking_id) REFERENCES Bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES Vehicles(vehicle_id) ON DELETE NO ACTION,
    FOREIGN KEY (slot_id) REFERENCES ParkingSlots(slot_id) ON DELETE NO ACTION
);
ALTER TABLE ParkingRecords
ALTER COLUMN booking_id INT NOT NULL;

-- Payments with single CASCADE
CREATE TABLE Payments (
    payment_id INT IDENTITY(1,1) PRIMARY KEY,
    record_id INT NOT NULL UNIQUE,
    tariff_id INT NULL,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    payment_status VARCHAR(20) CHECK (payment_status IN ('Paid','Pending','Failed')) DEFAULT 'Pending',
    FOREIGN KEY (record_id) REFERENCES ParkingRecords(record_id) ON DELETE CASCADE,
    FOREIGN KEY (tariff_id) REFERENCES ParkingTariffs(tariff_id) ON DELETE SET NULL
);

ALTER TABLE Payments
ALTER COLUMN record_id INT NULL;


-- UserMemberships with single CASCADE
CREATE TABLE UserMemberships (
    user_membership_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    membership_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (membership_id) REFERENCES Memberships(membership_id) ON DELETE NO ACTION,
    CONSTRAINT chk_membership_dates CHECK (start_date < end_date)
);

-- Penalties with single CASCADE
CREATE TABLE Penalties (
    penalty_id INT IDENTITY(1,1) PRIMARY KEY,
    record_id INT NOT NULL,
    penalty_amount DECIMAL(10, 2) CHECK (penalty_amount >= 0),
    reason VARCHAR(100),
    penalty_status VARCHAR(10) CHECK (penalty_status IN ('Paid','Unpaid')) DEFAULT 'Unpaid',
    FOREIGN KEY (record_id) REFERENCES ParkingRecords(record_id) ON DELETE CASCADE
);

ALTER TABLE Memberships ADD CONSTRAINT chk_discount_range CHECK (discount >= 0 AND discount <= 100);
ALTER TABLE Users
ADD role VARCHAR(10) NOT NULL 
    CONSTRAINT DF_Users_role DEFAULT 'driver'
    CONSTRAINT CK_Users_role CHECK (role IN ('admin', 'driver'));


ALTER TABLE Users
ADD password VARCHAR(50) NOT NULL;
ALTER TABLE Users
Drop column password_hash 

CREATE TABLE MembershipPayments (
    membership_payment_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    membership_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(20) CHECK (payment_status IN ('Paid','Pending','Failed')) DEFAULT 'Pending',
    payment_date DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (membership_id) REFERENCES Memberships(membership_id)
);
-- *********************DQL AND VIEWS**************************

--Views:
CREATE VIEW vw_ActiveBookings AS
SELECT b.booking_id,
       u.name AS user_name,
       v.license_plate,
       b.booking_start_time,
       b.booking_end_time,
       b.status
FROM Bookings b
JOIN UserVehicles uv ON b.user_vehicle_id = uv.user_vehicle_id
JOIN Users u ON uv.user_id = u.user_id
JOIN Vehicles v ON uv.vehicle_id = v.vehicle_id
WHERE b.status IN ('Confirmed', 'Completed');


CREATE VIEW vw_MembershipDetails AS
SELECT um.user_membership_id,
       u.name AS user_name,
       m.plan_name,
       um.start_date,
       um.end_date
FROM UserMemberships um
JOIN Users u ON um.user_id = u.user_id
JOIN Memberships m ON um.membership_id = m.membership_id;


CREATE VIEW vw_ParkingSlotUtilization AS
SELECT vehicle_type,
       status,
       COUNT(*) AS total_slots
FROM ParkingSlots
GROUP BY vehicle_type, status;


CREATE VIEW vw_PenaltiesWithVehicle AS
SELECT p.penalty_id,
       p.penalty_amount,
       p.reason,
       p.penalty_status,
       v.license_plate
FROM Penalties p
JOIN ParkingRecords pr ON p.record_id = pr.record_id
JOIN Vehicles v ON pr.vehicle_id = v.vehicle_id;



--Triggers:
--trigger to prevent booking overlap-pre booking feature already implemented through our schema
CREATE TRIGGER trg_PreventBookingOverlap
ON Bookings
INSTEAD OF INSERT
AS
BEGIN
    IF EXISTS(
        SELECT 1 FROM Bookings b
        JOIN inserted i ON b.slot_id=i.slot_id
        WHERE i.booking_start_time < b.booking_end_time
          AND i.booking_end_time > b.booking_start_time
    )
    BEGIN
        RAISERROR('Booking time conflicts with existing booking on same slot!!', 16, 1)
        ROLLBACK TRANSACTION
    END
    ELSE
    BEGIN
        INSERT INTO Bookings(user_vehicle_id,slot_id,booking_start_time,booking_end_time,tariff_id,status)
        SELECT user_vehicle_id,slot_id,booking_start_time,booking_end_time,tariff_id,status
        FROM inserted
    END
END



--trigger for auto penalty in the case of overtime stay
CREATE TRIGGER trg_AutoPenaltyOnExit
ON ParkingRecords
AFTER UPDATE
AS
BEGIN
    IF EXISTS(
        SELECT 1 FROM inserted i
        JOIN Bookings b ON i.booking_id=b.booking_id
        WHERE i.exit_time IS NOT NULL AND i.exit_time > b.booking_end_time
    )
    BEGIN
        INSERT INTO Penalties(record_id,penalty_amount,reason,penalty_status)
        SELECT
            i.record_id,
            10.00,  --fixed penalty amount
            'Overstayed beyond booking time',
            'Unpaid'
        FROM inserted i
        JOIN Bookings b ON i.booking_id=b.booking_id
        WHERE i.exit_time IS NOT NULL AND i.exit_time > b.booking_end_time
    END
END

--This trigger automatically deletes any unpaid penalty associated with a parking record when a payment is recorded as "Paid."
CREATE TRIGGER trg_RemovePenaltyOnPayment
ON Payments
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Delete any unpaid penalties for parking records that now have a paid payment.
    DELETE FROM Penalties
    WHERE penalty_status = 'Unpaid'
      AND record_id IN (
          SELECT record_id
          FROM inserted
          WHERE payment_status = 'Paid'
      );
END
GO


--DQL Queries for VPMS:
--Table by table implementation


--Users Table: Owner's Info
--List all registered users
SELECT * FROM Users;

-- Find user by contact or name-implemented on Node Js through parameters
SELECT * FROM Users WHERE contact_number='03001234567' OR name LIKE '%Ali%';

--Count total registered users
SELECT COUNT(*) AS total_users FROM Users;

--updation for user
UPDATE Users
SET 
    name = 'New Name',
    contact_number = '0987654321',
    email = 'new.email@example.com'
WHERE user_id = 1;



--Vehicles Table:Vehicle Records
--List all vehicles
SELECT * FROM Vehicles;

-- Find vehicle by license plate-mainly implemented on Node Js through parameters
 SELECT * FROM Vehicles WHERE license_plate='LEA-1234';
--Count vehicles by type
SELECT vehicle_type, COUNT(*) AS total FROM Vehicles GROUP BY vehicle_type;



--UserVehicles Table:Owner Vehicle collective record
--Fetch all vehicles owned by a user
SELECT uv.user_vehicle_id,u.name,v.license_plate,v.vehicle_type
FROM UserVehicles uv
JOIN Users u ON uv.user_id=u.user_id
JOIN Vehicles v ON uv.vehicle_id=v.vehicle_id;

--Check if a vehicle is already assigned to a user-mainly implemented on Node Js through parameters
SELECT * FROM UserVehicles WHERE vehicle_id=3;


--ParkingSlots Table:Slot Availability and Status
--View all parking slots
SELECT * FROM ParkingSlots;

--View available slots by vehicle type-mainly implemented on Node Js through parameters
SELECT * FROM ParkingSlots WHERE status='Available' AND vehicle_type='Car';

--Count slot utilization through vehicle type
SELECT vehicle_type,status,COUNT(*) AS total
FROM ParkingSlots
GROUP BY vehicle_type,status;




--Bookings Table:Reservations
--View all current bookings
SELECT * FROM Bookings;

--Check overlapping bookings for a slot (prevent overbooking)
SELECT * FROM Bookings
WHERE slot_id=5 
  AND booking_start_time < '2025-04-01 12:00:00'
  AND booking_end_time > '2025-04-01 10:00:00';

--List the bookings by user
SELECT b.*,u.name,v.license_plate
FROM Bookings b
JOIN UserVehicles uv ON b.user_vehicle_id=uv.user_vehicle_id
JOIN Users u ON uv.user_id=u.user_id
JOIN Vehicles v ON uv.vehicle_id=v.vehicle_id;

--Active bookings in VPMS
SELECT * FROM Bookings WHERE status IN('Confirmed', 'Completed');


--ParkingRecords Table:Entry/Exit Logs
--View all parking records
SELECT * FROM ParkingRecords;

--Parking history for a vehicle-mainly implemented on Node Js through parameters
SELECT * FROM ParkingRecords WHERE vehicle_id=2;

--List Currently parked vehicle-with no exit yet
SELECT pr.*,v.license_plate 
FROM ParkingRecords pr
JOIN Vehicles v ON pr.vehicle_id=v.vehicle_id
WHERE exit_time IS NULL;

--Calculate duration spent in the parking lot
SELECT DATEDIFF(MINUTE, entry_time, exit_time)AS duration_minutes FROM ParkingRecords WHERE record_id=10;




-- ParkingTariffs Table (without effective_date):
-- View all tariffs
SELECT * FROM ParkingTariffs;

-- Get rates for specific vehicle types
SELECT rate FROM ParkingTariffs
WHERE vehicle_type='Car' AND rate_type='Hourly';

-- Update rates (simplified without effective_date)
UPDATE ParkingTariffs
SET rate = 6.00
WHERE vehicle_type = 'Car' AND rate_type = 'Hourly';




--Payments Table:Payment Integration
-- View all payments
SELECT * FROM Payments;

--payments with record and vehicle information
SELECT p.*, pr.entry_time, pr.exit_time, v.license_plate
FROM Payments p
JOIN ParkingRecords pr ON p.record_id = pr.record_id
JOIN Vehicles v ON pr.vehicle_id = v.vehicle_id;

--Calculate pending payments
SELECT * FROM Payments WHERE payment_status = 'Pending';

--Calculate Total revenue generated from VPMS so far
SELECT SUM(amount) AS total_revenue FROM Payments WHERE payment_status = 'Paid';





--Members and Usermemberships Table:For Membership Plans
-- Memberships Table (with discount):
-- View all membership plans with discount
SELECT membership_id, plan_name, fee, duration, discount FROM Memberships;

-- View memberships filtered by user with discount info
SELECT um.*, u.name, m.plan_name, m.discount
FROM UserMemberships um
JOIN Users u ON um.user_id = u.user_id
JOIN Memberships m ON um.membership_id = m.membership_id;

-- Update membership with discount
UPDATE Memberships
SET 
    plan_name = 'Platinum Annual',
    fee = 1500.00,
    duration = 365,
    discount = 15  -- Added discount field
WHERE membership_id = 1;

--Currently active users with memberships
SELECT * FROM UserMemberships WHERE start_date <= GETDATE() AND end_date >= GETDATE();

--implemantation on Node Js using Parameters
UPDATE UserMemberships
SET 
    membership_id = 2,   -- new membership plan id
    start_date = '2023-08-01',
    end_date = '2023-08-31'
WHERE user_membership_id = 5;



--Penalties Table: Extra charges
--View all penalties
SELECT * FROM Penalties;

--View unpaid penalties
SELECT * FROM Penalties WHERE penalty_status='Unpaid';

--Penalties along with vehicle info
SELECT p.*, v.license_plate
FROM Penalties p
JOIN ParkingRecords pr ON p.record_id=pr.record_id
JOIN Vehicles v ON pr.vehicle_id=v.vehicle_id;


--Insert some initial values:
-- Insert into Users
INSERT INTO Users (name, contact_number, email, password, role) VALUES ('Alice Johnson', '03001234567', 'alice@example.com', 'alice123', 'driver');
INSERT INTO Users (name, contact_number, email, password, role) VALUES ('Bob Ahmed', '03111234567', 'bob@example.com', 'bobpass', 'driver');
INSERT INTO Users (name, contact_number, email, password, role) VALUES ('Admin User', '03221234567', 'admin@example.com', 'adminpass', 'admin');

-- Insert into Vehicles
INSERT INTO Vehicles (license_plate, vehicle_type) VALUES ('LEA1234', 'Car');
INSERT INTO Vehicles (license_plate, vehicle_type) VALUES ('BKE5678', 'Bike');
INSERT INTO Vehicles (license_plate, vehicle_type) VALUES ('XYZ9876', 'Car');

-- Insert into UserVehicles
INSERT INTO UserVehicles (user_id, vehicle_id) VALUES (1, 1);
INSERT INTO UserVehicles (user_id, vehicle_id) VALUES (2, 2);
INSERT INTO UserVehicles (user_id, vehicle_id) VALUES (1, 3);

-- Insert into ParkingSlots
INSERT INTO ParkingSlots (slot_number, vehicle_type, status) VALUES ('A1', 'Car', 'Available');
INSERT INTO ParkingSlots (slot_number, vehicle_type, status) VALUES ('B1', 'Bike', 'Available');
INSERT INTO ParkingSlots (slot_number, vehicle_type, status) VALUES ('C1', 'Car', 'Available');

-- Insert into ParkingTariffs
INSERT INTO ParkingTariffs (vehicle_type, rate_type, rate) VALUES ('Car', 'Hourly', 50.00);
INSERT INTO ParkingTariffs (vehicle_type, rate_type, rate) VALUES ('Bike', 'Hourly', 30.00);

-- Insert into Memberships
INSERT INTO Memberships (plan_name, fee, duration, discount) VALUES ('Standard Plan', 500.00, 30, 10);
INSERT INTO Memberships (plan_name, fee, duration, discount) VALUES ('Premium Plan', 1000.00, 60, 20);



--Statements we used to fully implement our backend with frontend-had to make some changes
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_PreventBookingOverlap')
BEGIN
    DROP TRIGGER trg_PreventBookingOverlap;
END


INSERT INTO ParkingSlots (slot_number, vehicle_type, status)
VALUES 
('D1', 'Car', 'Available'),
('D2', 'Car', 'Available'),
('D3', 'Car', 'Available');



select * from users
select * from bookings
select * from UserVehicles
select * from ParkingRecords
select * from ParkingTariffs
select * from Payments
select * from Memberships
select * from UserMemberships
select * from Penalties
select * from ParkingSlots
select* from vehicles
select* from MembershipPayments
USE VehicleManagement;

-- Step 1: Delete from dependent tables first
DELETE FROM Penalties;
DELETE FROM Payments;
DELETE FROM ParkingRecords;
DELETE FROM Bookings;
DELETE FROM UserMemberships;
DELETE FROM UserVehicles;

-- Step 2: Then delete from base/reference tables
DELETE FROM Vehicles;
DELETE FROM ParkingSlots;
DELETE FROM ParkingTariffs;
DELETE FROM Memberships;
DELETE FROM Users;
DELETE FROM MembershipPayments
-- Reset identity for Users
DBCC CHECKIDENT ('Users', RESEED, 0);

-- Reset identity for Vehicles
DBCC CHECKIDENT ('Vehicles', RESEED, 0);

-- Reset identity for UserVehicles
DBCC CHECKIDENT ('UserVehicles', RESEED, 0);

-- Reset identity for ParkingSlots
DBCC CHECKIDENT ('ParkingSlots', RESEED, 0);

-- Reset identity for ParkingTariffs
DBCC CHECKIDENT ('ParkingTariffs', RESEED, 0);

-- Reset identity for Memberships
DBCC CHECKIDENT ('Memberships', RESEED, 0);

-- Reset identity for Bookings
DBCC CHECKIDENT ('Bookings', RESEED, 0);

-- Reset identity for ParkingRecords
DBCC CHECKIDENT ('ParkingRecords', RESEED, 0);

-- Reset identity for Payments
DBCC CHECKIDENT ('Payments', RESEED, 0);

-- Reset identity for MembershipPayments (new table)
DBCC CHECKIDENT ('MembershipPayments', RESEED, 0);

-- Reset identity for UserMemberships
DBCC CHECKIDENT ('UserMemberships', RESEED, 0);

-- Reset identity for Penalties
DBCC CHECKIDENT ('Penalties', RESEED, 0);




