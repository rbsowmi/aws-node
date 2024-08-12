import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { DynamoDBClient, docClient } = require('@aws-sdk/client-dynamodb');
const { PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb')
const client = new DynamoDBClient({ region: 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);
const crypto = require('crypto');
const uniqueid = () => {
    const timestamp = Date.now().toString();
    const randomnum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return timestamp + randomnum;
}
const createUser = async (userData) => {
    const encryptedPassword = crypto.createHash('sha256').update(userData.password).digest('hex');
    userData.password = encryptedPassword;
    userData.id = uniqueid();
    const getParams = {
        TableName: 'User',
        Key: { email: userData.email }
    }
    try {
        const getCommand = new GetCommand(getParams);
        const exist = await docClient.send(getCommand);
        console.log(exist.Item)
        if (exist.Item && exist.Item.email) {

            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: 'email is already exist'
                })
            }
        }
        const params = {
            TableName: 'User',
            Item: userData
        }
        const command = new PutCommand(params);
        const result = await docClient.send(command);
        console.log("dynamodb result", result)
        console.log("created")
        return {
            statusCode: 201,
            body: JSON.stringify({
                message: 'User created successfull'
            }),
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Internal Server Error.'
            })
        };
    }
};
export const handler = async (event) => {
    try {
        const { httpMethod, path, body } = event
        if (event.httpMethod === 'POST' && path === '/User/register') {
            let userData = JSON.parse(body);

            const userRegex = /^[a-zA-Z0-9_-]{3,20}$/;
            const emailRegex = /^[a-z0-9._%+-]{1,30}@gmail\.com$/;
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@!#$%^&*])[a-zA-Z\d@!#$%^&*]{8,12}$/
            if (!userRegex.test(userData.username) || !emailRegex.test(userData.email) || !passwordRegex.test(userData.password)) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ message: "username,email,and password are required" })
                }
            }

            const res = await createUser(userData);
            console.log(res);
            return {
                statusCode: 201,
                body: JSON.stringify({ message: "User create successfully" })
            }
        }
    }
 
}
