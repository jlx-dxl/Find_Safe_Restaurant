-- create Restaurant table
CREATE TABLE Restaurant (
  ID INT PRIMARY KEY,
  Location VARCHAR(255),
  Name VARCHAR(255),
  Address VARCHAR(255)
);

-- create Inspection table
CREATE TABLE Inspection (
  ID INT,
  Date DATE,
  Risk VARCHAR(255),
  Type VARCHAR(255),
  Result VARCHAR(255),
  PRIMARY KEY (ID, Date),
  FOREIGN KEY (ID) REFERENCES Restaurant(ID)
);

-- create Crime_rank table
CREATE TABLE Crime_rank (
  Location_des VARCHAR(255),
  Type VARCHAR(255) CHECK (Type IN ('Battery', 'Theft', 'Robbery','Assault')),
  CrimeRankID INT,
  Arrest BOOLEAN,
  Danger_score INT,
  PRIMARY KEY (Location_des, Type, Arrest),
);

-- create Crime table
CREATE TABLE Crime (
  ID INT PRIMARY KEY,
  TYPE 
  Block VARCHAR(255),
  Location VARCHAR(255),
  Result VARCHAR(255),
  Crime_Location_des VARCHAR(255),
  Crime_Type VARCHAR(255),
  Crime_Arrest BOOLEAN,
  RESTAURANTE_ID INT,
  FOREIGN KEY (Crime_Location_des, Crime_Type, Crime_Arrest) 
  REFERENCES Crime_rank(Location_des, Type, Arrest)
  FOREIGN KEY (RESTAURANTE_ID) REFERENCES Restaurant(ID)
);

-- create Happen table
CREATE TABLE Happen (
  Crime_ID INT,
  Restaurante_ID INT,
  Location VARCHAR(255),
  FOREIGN KEY (Restaurante_ID) REFERENCES Restaurant(ID),
  FOREIGN KEY (Crime_ID) REFERENCES Crime(ID)
);