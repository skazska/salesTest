#Task
1. Create a Salesforce Developer Org.
2. Create three Validation Rules on Account. Activate two of them.
3. Create three Workflow Rules on Account. Activate two of them.
4. Create two Triggers on Account. Activate one of them.
5. Write an AWS Lambda Function in Node.js “TurnOffMetadata” that takes as inputs a
username, password+security token and an object name. The function should find out all the
active Validation Rules, Workflow Rules and Trigger and deactivate them. It should log to the
console the ids and names of all the components it deactivated.  

Use Salesforce Tooling API to query for all the active components. Use the Salesforce Tooling
API to Turn Off all Validation Rules and Workflow Rules. You might need to use Salesforce
Metadata API to Turn Off Triggers if you run into issues with Tooling API.  

The jsforce library has most of the function you need already built.
Submit a .zip file that can be uploaded into AWS Lambda and executed. If you do not have an
AWS Account to test the Lambda function you can test it locally. There are several Frameworks
to help do this.

Package should have a event.json file that can be used as a template to test the
Lambda Function. 