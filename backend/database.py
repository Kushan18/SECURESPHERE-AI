import os
import json
import certifi
from pymongo import MongoClient
from dotenv import load_dotenv
from bson import ObjectId
from datetime import datetime

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME", "securesphere")

class LocalJSONCollection:
    """Fallback collection using local JSON files when Atlas MongoDB connection is unavailable."""
    def __init__(self, filename):
        self.filepath = os.path.join(os.path.dirname(__file__), "data", f"{filename}.json")
        os.makedirs(os.path.dirname(self.filepath), exist_ok=True)
        if not os.path.exists(self.filepath):
            with open(self.filepath, "w") as f:
                json.dump([], f)
                
    def _read(self):
        try:
            with open(self.filepath, "r") as f:
                return json.load(f)
        except Exception:
            return []
            
    def _write(self, data):
        try:
            with open(self.filepath, "w") as f:
                json.dump(data, f, default=str, indent=2)
        except Exception as e:
            print(f"Error writing to local JSON db: {e}")
            
    def insert_one(self, document):
        data = self._read()
        if "_id" not in document:
            document["_id"] = str(ObjectId())
        else:
            document["_id"] = str(document["_id"])
            
        # Convert datetime objects to ISO strings
        for k, v in list(document.items()):
            if isinstance(v, datetime):
                document[k] = v.isoformat()
                
        data.append(document)
        self._write(data)
        
        class InsertResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return InsertResult(document["_id"])
        
    def find_one(self, filter_dict):
        data = self._read()
        for doc in data:
            match = True
            for k, v in filter_dict.items():
                val = str(v) if isinstance(v, ObjectId) else v
                # Check match
                if doc.get(k) != val:
                    match = False
                    break
            if match:
                return doc.copy()
        return None
        
    def find(self, filter_dict=None):
        if filter_dict is None:
            filter_dict = {}
        data = self._read()
        results = []
        for doc in data:
            match = True
            for k, v in filter_dict.items():
                val = str(v) if isinstance(v, ObjectId) else v
                if doc.get(k) != val:
                    match = False
                    break
            if match:
                results.append(doc.copy())
                
        class Cursor:
            def __init__(self, items):
                self.items = items
            def sort(self, key, direction=-1):
                try:
                    self.items.sort(key=lambda x: x.get(key, ""), reverse=(direction == -1))
                except Exception:
                    pass
                return self
            def __iter__(self):
                return iter(self.items)
                
        return Cursor(results)


# Attempt connection to MongoDB Atlas
use_fallback = False
client = None
db = None

try:
    if not MONGODB_URL:
        raise ValueError("MONGODB_URL environment variable is not set.")
    # Set serverSelectionTimeoutMS to 2 seconds so it doesn't block startup too long
    client = MongoClient(MONGODB_URL, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=2000)
    client.admin.command('ping')
    db = client[DATABASE_NAME]
    print("Successfully connected to MongoDB Atlas!")
except Exception as e:
    print(f"MongoDB connection failed: {e}. Falling back to Local JSON database storage.")
    use_fallback = True


# Export collections
if use_fallback:
    users_collection = LocalJSONCollection("users")
    scans_collection = LocalJSONCollection("scans")
    findings_collection = LocalJSONCollection("findings")
    reports_collection = LocalJSONCollection("reports")
else:
    users_collection = db["users"]
    scans_collection = db["scans"]
    findings_collection = db["findings"]
    reports_collection = db["reports"]

def test_connection():
    # If using fallback, we are always 'connected' to the local filesystem
    if use_fallback:
        print("Connected to Local JSON database fallback.")
        return True
    try:
        client.admin.command('ping')
        print("MongoDB connection is active.")
        return True
    except Exception as e:
        print(f"MongoDB connection is inactive: {e}")
        return False
