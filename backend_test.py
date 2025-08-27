#!/usr/bin/env python3
"""
Backend API Testing for Crime Reporting App
Tests all core authentication and CRUD operations
"""

import requests
import json
import base64
import os
from datetime import datetime, timezone
import time

# Configuration
BASE_URL = "https://crimereport-1.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@crimereport.com"
ADMIN_PASSWORD = "Asdf123$"

class CrimeReportAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.admin_token = None
        self.test_user_token = None
        self.test_user_id = None
        self.test_report_id = None
        self.test_crime_type_id = None
        self.test_results = []
        
    def log_result(self, test_name, success, message, details=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            "test": test_name,
            "status": status,
            "message": message,
            "details": details or {}
        }
        self.test_results.append(result)
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def test_health_check(self):
        """Test basic API connectivity"""
        try:
            response = self.session.get(f"{self.base_url}/")
            if response.status_code == 200:
                data = response.json()
                self.log_result("API Health Check", True, f"API is accessible: {data.get('message', 'OK')}")
                return True
            else:
                self.log_result("API Health Check", False, f"API returned status {response.status_code}")
                return False
        except Exception as e:
            self.log_result("API Health Check", False, f"Connection failed: {str(e)}")
            return False
    
    def test_admin_login(self):
        """Test admin login functionality"""
        try:
            login_data = {
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            }
            
            response = self.session.post(f"{self.base_url}/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                if "token" in data and "user" in data:
                    self.admin_token = data["token"]
                    self.log_result("Admin Login", True, "Admin login successful", {
                        "user_id": data["user"]["id"],
                        "is_admin": data["user"]["is_admin"]
                    })
                    return True
                else:
                    self.log_result("Admin Login", False, "Missing token or user in response", data)
                    return False
            else:
                self.log_result("Admin Login", False, f"Login failed with status {response.status_code}", 
                              response.text)
                return False
        except Exception as e:
            self.log_result("Admin Login", False, f"Login request failed: {str(e)}")
            return False
    
    def test_user_registration(self):
        """Test user registration functionality"""
        try:
            # Generate unique email for testing
            timestamp = int(time.time())
            test_email = f"testuser{timestamp}@example.com"
            
            user_data = {
                "name": "Test User",
                "email": test_email,
                "password": "testpass123",
                "phone": "9876543210",
                "city": "Bhopal"
            }
            
            response = self.session.post(f"{self.base_url}/register", json=user_data)
            
            if response.status_code == 200:
                data = response.json()
                if "token" in data and "user" in data:
                    self.test_user_token = data["token"]
                    self.test_user_id = data["user"]["id"]
                    self.log_result("User Registration", True, "User registration successful", {
                        "user_id": data["user"]["id"],
                        "email": test_email
                    })
                    return True
                else:
                    self.log_result("User Registration", False, "Missing token or user in response", data)
                    return False
            else:
                self.log_result("User Registration", False, f"Registration failed with status {response.status_code}", 
                              response.text)
                return False
        except Exception as e:
            self.log_result("User Registration", False, f"Registration request failed: {str(e)}")
            return False
    
    def test_user_login(self):
        """Test user login with registered user"""
        if not self.test_user_id:
            self.log_result("User Login", False, "No test user available for login test")
            return False
            
        try:
            # We'll use the token from registration, but test the /me endpoint to verify it works
            headers = {"Authorization": f"Bearer {self.test_user_token}"}
            response = self.session.get(f"{self.base_url}/me", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data["id"] == self.test_user_id:
                    self.log_result("User Token Verification", True, "User token is valid", {
                        "user_id": data["id"],
                        "name": data["name"]
                    })
                    return True
                else:
                    self.log_result("User Token Verification", False, "Token user ID mismatch", data)
                    return False
            else:
                self.log_result("User Token Verification", False, f"Token verification failed with status {response.status_code}", 
                              response.text)
                return False
        except Exception as e:
            self.log_result("User Token Verification", False, f"Token verification failed: {str(e)}")
            return False
    
    def test_crime_types(self):
        """Test crime types endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/crime-types")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    crime_types = [item["name"] for item in data if "name" in item]
                    self.log_result("Crime Types API", True, f"Retrieved {len(crime_types)} crime types", {
                        "crime_types": crime_types
                    })
                    return True
                else:
                    self.log_result("Crime Types API", False, "Empty or invalid crime types response", data)
                    return False
            else:
                self.log_result("Crime Types API", False, f"Crime types request failed with status {response.status_code}", 
                              response.text)
                return False
        except Exception as e:
            self.log_result("Crime Types API", False, f"Crime types request failed: {str(e)}")
            return False
    
    def test_crime_report_creation(self):
        """Test crime report creation (without image)"""
        if not self.test_user_token:
            self.log_result("Crime Report Creation", False, "No user token available for testing")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.test_user_token}"}
            
            # Test crime report data
            crime_data = {
                "crime_type": "Illegal Drug",
                "location": "MP Nagar, Bhopal",
                "landmark": "Zone 1 Market",
                "crime_time": datetime.now(timezone.utc).isoformat(),
                "criminal_name": "Unknown Suspect",
                "crime_details": "Suspicious drug dealing activity observed near the market area",
                "is_anonymous": False
            }
            
            # Send as form data (as expected by the API)
            form_data = {
                "crime_data": json.dumps(crime_data)
            }
            
            response = self.session.post(f"{self.base_url}/crime-reports", 
                                       data=form_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if "report" in data and "message" in data:
                    self.log_result("Crime Report Creation", True, "Crime report created successfully", {
                        "report_id": data["report"]["id"],
                        "crime_type": data["report"]["crime_type"],
                        "location": data["report"]["location"]
                    })
                    return True
                else:
                    self.log_result("Crime Report Creation", False, "Invalid response format", data)
                    return False
            else:
                self.log_result("Crime Report Creation", False, f"Crime report creation failed with status {response.status_code}", 
                              response.text)
                return False
        except Exception as e:
            self.log_result("Crime Report Creation", False, f"Crime report creation failed: {str(e)}")
            return False
    
    def test_anonymous_crime_report(self):
        """Test anonymous crime report creation"""
        if not self.test_user_token:
            self.log_result("Anonymous Crime Report", False, "No user token available for testing")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.test_user_token}"}
            
            # Test anonymous crime report data
            crime_data = {
                "crime_type": "Illegal Trafficking",
                "location": "Habibganj, Bhopal",
                "landmark": "Railway Station",
                "crime_time": datetime.now(timezone.utc).isoformat(),
                "criminal_name": "Unknown",
                "crime_details": "Suspicious trafficking activity reported anonymously",
                "is_anonymous": True
            }
            
            # Send as form data
            form_data = {
                "crime_data": json.dumps(crime_data)
            }
            
            response = self.session.post(f"{self.base_url}/crime-reports", 
                                       data=form_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if "report" in data and data["report"]["is_anonymous"] and data["report"]["user_name"] == "Anonymous":
                    self.log_result("Anonymous Crime Report", True, "Anonymous crime report created successfully", {
                        "report_id": data["report"]["id"],
                        "user_name": data["report"]["user_name"],
                        "is_anonymous": data["report"]["is_anonymous"]
                    })
                    return True
                else:
                    self.log_result("Anonymous Crime Report", False, "Anonymous flag not properly set", data)
                    return False
            else:
                self.log_result("Anonymous Crime Report", False, f"Anonymous report creation failed with status {response.status_code}", 
                              response.text)
                return False
        except Exception as e:
            self.log_result("Anonymous Crime Report", False, f"Anonymous report creation failed: {str(e)}")
            return False
    
    def test_crime_feed_basic(self):
        """Test basic crime feed retrieval"""
        try:
            response = self.session.get(f"{self.base_url}/crime-reports")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result("Crime Feed Basic", True, f"Retrieved {len(data)} crime reports", {
                        "report_count": len(data)
                    })
                    return True
                else:
                    self.log_result("Crime Feed Basic", False, "Invalid response format", data)
                    return False
            else:
                self.log_result("Crime Feed Basic", False, f"Crime feed request failed with status {response.status_code}", 
                              response.text)
                return False
        except Exception as e:
            self.log_result("Crime Feed Basic", False, f"Crime feed request failed: {str(e)}")
            return False
    
    def test_crime_feed_filtering(self):
        """Test crime feed with filters"""
        try:
            # Test city filter
            params = {"city": "Bhopal", "limit": 10}
            response = self.session.get(f"{self.base_url}/crime-reports", params=params)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result("Crime Feed City Filter", True, f"City filter returned {len(data)} reports")
                else:
                    self.log_result("Crime Feed City Filter", False, "Invalid response format", data)
                    return False
            else:
                self.log_result("Crime Feed City Filter", False, f"City filter failed with status {response.status_code}")
                return False
            
            # Test crime type filter
            params = {"crime_type": "Illegal Drug", "limit": 5}
            response = self.session.get(f"{self.base_url}/crime-reports", params=params)
            
            if response.status_code == 200:
                data = response.json()
                self.log_result("Crime Feed Type Filter", True, f"Crime type filter returned {len(data)} reports")
            else:
                self.log_result("Crime Feed Type Filter", False, f"Crime type filter failed with status {response.status_code}")
                return False
            
            # Test search functionality
            params = {"search": "drug", "limit": 5}
            response = self.session.get(f"{self.base_url}/crime-reports", params=params)
            
            if response.status_code == 200:
                data = response.json()
                self.log_result("Crime Feed Search", True, f"Search returned {len(data)} reports")
                return True
            else:
                self.log_result("Crime Feed Search", False, f"Search failed with status {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("Crime Feed Filtering", False, f"Filtering tests failed: {str(e)}")
            return False
    
    def test_individual_report_retrieval(self):
        """Test retrieving individual crime report by ID"""
        if not self.test_report_id:
            # First create a report to test with
            if not self.test_crime_report_creation():
                self.log_result("Individual Report Retrieval", False, "Could not create test report")
                return False
        
        try:
            response = self.session.get(f"{self.base_url}/crime-reports/{self.test_report_id}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("id") == self.test_report_id:
                    self.log_result("Individual Report Retrieval", True, "Successfully retrieved report by ID", {
                        "report_id": data["id"],
                        "crime_type": data.get("crime_type")
                    })
                    return True
                else:
                    self.log_result("Individual Report Retrieval", False, "Report ID mismatch", data)
                    return False
            else:
                self.log_result("Individual Report Retrieval", False, f"Report retrieval failed with status {response.status_code}", 
                              response.text)
                return False
        except Exception as e:
            self.log_result("Individual Report Retrieval", False, f"Report retrieval failed: {str(e)}")
            return False
    
    def test_comments_system(self):
        """Test adding and retrieving comments on crime reports"""
        if not self.test_user_token or not self.test_report_id:
            self.log_result("Comments System", False, "Missing user token or report ID for testing")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.test_user_token}"}
            
            # Add a comment
            comment_data = {
                "comment_text": "This is a test comment on the crime report. Very concerning incident."
            }
            
            response = self.session.post(f"{self.base_url}/crime-reports/{self.test_report_id}/comments", 
                                       json=comment_data, headers=headers)
            
            if response.status_code == 200:
                comment_response = response.json()
                comment_id = comment_response.get("id")
                
                # Now retrieve comments to verify
                response = self.session.get(f"{self.base_url}/crime-reports/{self.test_report_id}/comments")
                
                if response.status_code == 200:
                    comments = response.json()
                    if isinstance(comments, list) and len(comments) > 0:
                        # Check if our comment is in the list
                        found_comment = any(c.get("id") == comment_id for c in comments)
                        if found_comment:
                            self.log_result("Comments System", True, "Comment added and retrieved successfully", {
                                "comment_id": comment_id,
                                "total_comments": len(comments)
                            })
                            return True
                        else:
                            self.log_result("Comments System", False, "Added comment not found in retrieval")
                            return False
                    else:
                        self.log_result("Comments System", False, "No comments retrieved after adding")
                        return False
                else:
                    self.log_result("Comments System", False, f"Comment retrieval failed with status {response.status_code}")
                    return False
            else:
                self.log_result("Comments System", False, f"Comment addition failed with status {response.status_code}", 
                              response.text)
                return False
        except Exception as e:
            self.log_result("Comments System", False, f"Comments system test failed: {str(e)}")
            return False
    
    def test_credibility_rating_system(self):
        """Test credibility rating system (0-10 scale)"""
        if not self.test_user_token or not self.test_report_id:
            self.log_result("Credibility Rating System", False, "Missing user token or report ID for testing")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.test_user_token}"}
            
            # Add a credibility rating
            rating_data = {
                "rating": 8  # Rating on 0-10 scale
            }
            
            response = self.session.post(f"{self.base_url}/crime-reports/{self.test_report_id}/rating", 
                                       json=rating_data, headers=headers)
            
            if response.status_code == 200:
                rating_response = response.json()
                
                # Now retrieve the user's rating to verify
                response = self.session.get(f"{self.base_url}/crime-reports/{self.test_report_id}/rating", 
                                          headers=headers)
                
                if response.status_code == 200:
                    user_rating = response.json()
                    if user_rating.get("rating") == 8:
                        self.log_result("Credibility Rating System", True, "Rating added and retrieved successfully", {
                            "rating": user_rating["rating"],
                            "message": rating_response.get("message")
                        })
                        return True
                    else:
                        self.log_result("Credibility Rating System", False, "Rating mismatch", user_rating)
                        return False
                else:
                    self.log_result("Credibility Rating System", False, f"Rating retrieval failed with status {response.status_code}")
                    return False
            else:
                self.log_result("Credibility Rating System", False, f"Rating addition failed with status {response.status_code}", 
                              response.text)
                return False
        except Exception as e:
            self.log_result("Credibility Rating System", False, f"Credibility rating test failed: {str(e)}")
            return False
    
    def test_admin_crime_types_crud(self):
        """Test admin CRUD operations for crime types"""
        if not self.admin_token:
            self.log_result("Admin Crime Types CRUD", False, "No admin token available for testing")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # CREATE: Add a new crime type
            new_crime_type = {
                "name": "Test Crime Type - Cybercrime"
            }
            
            response = self.session.post(f"{self.base_url}/admin/crime-types", 
                                       json=new_crime_type, headers=headers)
            
            if response.status_code == 200:
                created_type = response.json()
                self.test_crime_type_id = created_type.get("id")
                
                # READ: Verify it appears in the list
                response = self.session.get(f"{self.base_url}/crime-types")
                if response.status_code == 200:
                    crime_types = response.json()
                    found_type = any(ct.get("name") == "Test Crime Type - Cybercrime" for ct in crime_types)
                    
                    if found_type:
                        # UPDATE: Modify the crime type
                        updated_data = {
                            "name": "Updated Test Crime Type - Advanced Cybercrime"
                        }
                        
                        response = self.session.put(f"{self.base_url}/admin/crime-types/{self.test_crime_type_id}", 
                                                  json=updated_data, headers=headers)
                        
                        if response.status_code == 200:
                            # DELETE: Remove the crime type
                            response = self.session.delete(f"{self.base_url}/admin/crime-types/{self.test_crime_type_id}", 
                                                         headers=headers)
                            
                            if response.status_code == 200:
                                self.log_result("Admin Crime Types CRUD", True, "All CRUD operations successful", {
                                    "created_id": self.test_crime_type_id,
                                    "operations": "CREATE, READ, UPDATE, DELETE"
                                })
                                return True
                            else:
                                self.log_result("Admin Crime Types CRUD", False, f"DELETE failed with status {response.status_code}")
                                return False
                        else:
                            self.log_result("Admin Crime Types CRUD", False, f"UPDATE failed with status {response.status_code}")
                            return False
                    else:
                        self.log_result("Admin Crime Types CRUD", False, "Created crime type not found in list")
                        return False
                else:
                    self.log_result("Admin Crime Types CRUD", False, f"READ operation failed with status {response.status_code}")
                    return False
            else:
                self.log_result("Admin Crime Types CRUD", False, f"CREATE failed with status {response.status_code}", 
                              response.text)
                return False
        except Exception as e:
            self.log_result("Admin Crime Types CRUD", False, f"Admin CRUD test failed: {str(e)}")
            return False
    
    def test_admin_report_blocking(self):
        """Test admin blocking and unblocking of crime reports"""
        if not self.admin_token or not self.test_report_id:
            self.log_result("Admin Report Blocking", False, "Missing admin token or report ID for testing")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # BLOCK the report
            block_data = {
                "is_blocked": True,
                "reason": "Test blocking for inappropriate content"
            }
            
            response = self.session.put(f"{self.base_url}/admin/crime-reports/{self.test_report_id}/block", 
                                      json=block_data, headers=headers)
            
            if response.status_code == 200:
                block_response = response.json()
                
                # Verify the report is blocked (should return 404 for regular users)
                response = self.session.get(f"{self.base_url}/crime-reports/{self.test_report_id}")
                
                if response.status_code == 404:
                    # UNBLOCK the report
                    unblock_data = {
                        "is_blocked": False
                    }
                    
                    response = self.session.put(f"{self.base_url}/admin/crime-reports/{self.test_report_id}/block", 
                                              json=unblock_data, headers=headers)
                    
                    if response.status_code == 200:
                        # Verify the report is accessible again
                        response = self.session.get(f"{self.base_url}/crime-reports/{self.test_report_id}")
                        
                        if response.status_code == 200:
                            self.log_result("Admin Report Blocking", True, "Block and unblock operations successful", {
                                "report_id": self.test_report_id,
                                "operations": "BLOCK, VERIFY_BLOCKED, UNBLOCK, VERIFY_UNBLOCKED"
                            })
                            return True
                        else:
                            self.log_result("Admin Report Blocking", False, "Report not accessible after unblocking")
                            return False
                    else:
                        self.log_result("Admin Report Blocking", False, f"UNBLOCK failed with status {response.status_code}")
                        return False
                else:
                    self.log_result("Admin Report Blocking", False, "Report still accessible after blocking")
                    return False
            else:
                self.log_result("Admin Report Blocking", False, f"BLOCK failed with status {response.status_code}", 
                              response.text)
                return False
        except Exception as e:
            self.log_result("Admin Report Blocking", False, f"Admin blocking test failed: {str(e)}")
            return False
    
    def test_admin_view_all_reports(self):
        """Test admin endpoint to view all reports including blocked ones"""
        if not self.admin_token:
            self.log_result("Admin View All Reports", False, "No admin token available for testing")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            response = self.session.get(f"{self.base_url}/admin/crime-reports", headers=headers)
            
            if response.status_code == 200:
                reports = response.json()
                if isinstance(reports, list):
                    self.log_result("Admin View All Reports", True, f"Admin retrieved {len(reports)} reports (including blocked)", {
                        "total_reports": len(reports)
                    })
                    return True
                else:
                    self.log_result("Admin View All Reports", False, "Invalid response format", reports)
                    return False
            else:
                self.log_result("Admin View All Reports", False, f"Admin reports view failed with status {response.status_code}", 
                              response.text)
                return False
        except Exception as e:
            self.log_result("Admin View All Reports", False, f"Admin view all reports test failed: {str(e)}")
            return False
    
    def test_enhanced_report_statistics(self):
        """Test that reports show enhanced statistics (avg_credibility, total_ratings, comments_count)"""
        if not self.test_report_id:
            self.log_result("Enhanced Report Statistics", False, "No test report ID available")
            return False
            
        try:
            response = self.session.get(f"{self.base_url}/crime-reports/{self.test_report_id}")
            
            if response.status_code == 200:
                report = response.json()
                
                # Check if enhanced statistics fields are present
                required_fields = ["avg_credibility", "total_ratings", "comments_count"]
                missing_fields = [field for field in required_fields if field not in report]
                
                if not missing_fields:
                    self.log_result("Enhanced Report Statistics", True, "All enhanced statistics fields present", {
                        "avg_credibility": report.get("avg_credibility"),
                        "total_ratings": report.get("total_ratings"),
                        "comments_count": report.get("comments_count")
                    })
                    return True
                else:
                    self.log_result("Enhanced Report Statistics", False, f"Missing fields: {missing_fields}", report)
                    return False
            else:
                self.log_result("Enhanced Report Statistics", False, f"Report retrieval failed with status {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Enhanced Report Statistics", False, f"Enhanced statistics test failed: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all backend tests in sequence"""
        print("=" * 60)
        print("CRIME REPORTING APP - BACKEND API TESTING")
        print("=" * 60)
        print(f"Testing API at: {self.base_url}")
        print()
        
        # Test sequence
        tests = [
            ("API Health Check", self.test_health_check),
            ("Admin Login", self.test_admin_login),
            ("User Registration", self.test_user_registration),
            ("User Token Verification", self.test_user_login),
            ("Crime Types API", self.test_crime_types),
            ("Crime Report Creation", self.test_crime_report_creation),
            ("Anonymous Crime Report", self.test_anonymous_crime_report),
            ("Crime Feed Basic", self.test_crime_feed_basic),
            ("Crime Feed Filtering", self.test_crime_feed_filtering)
        ]
        
        passed = 0
        failed = 0
        
        for test_name, test_func in tests:
            print(f"\nRunning: {test_name}")
            try:
                if test_func():
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                self.log_result(test_name, False, f"Test execution failed: {str(e)}")
                failed += 1
            
            # Small delay between tests
            time.sleep(0.5)
        
        # Summary
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {passed + failed}")
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        print(f"Success Rate: {(passed / (passed + failed) * 100):.1f}%" if (passed + failed) > 0 else "0%")
        
        if failed > 0:
            print("\nFAILED TESTS:")
            for result in self.test_results:
                if "❌ FAIL" in result["status"]:
                    print(f"  - {result['test']}: {result['message']}")
        
        return passed, failed

if __name__ == "__main__":
    tester = CrimeReportAPITester()
    passed, failed = tester.run_all_tests()
    
    # Exit with appropriate code
    exit(0 if failed == 0 else 1)