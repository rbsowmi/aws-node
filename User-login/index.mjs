import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { GetCommand, DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb')
const client = new DynamoDBClient({ region: 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);
const { DynamoDBClient, docClient } = require('@aws-sdk/client-dynamodb');
const { PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb')
const crypto = require('crypto');
const jwt=require('jsonwebtoken');
const SECRET_KEY=process.env.SECRET_KEY;
const JWT_EXPIRES_IN=process.env.JWT_EXPIRES_IN || '1h';


const loginUser = async (userData) => {
    const { password, email } = userData;
    const hashedpassword = crypto.createHash('sha256').update(password).digest('hex')
    const params = {
        TableName: 'User',
        Key: { email }
    }
    try {
        const command = new GetCommand(params);
        const result = await docClient.send(command);
        if (result.Item && result.Item.password === hashedpassword) {
            const token =jwt.sign({email:result.Item.email},SECRET_KEY,{expiresIn:JWT_EXPIRES_IN})
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'login successful' })

            }
        }
       
    }
    catch (error) {
        console.log('Error fetchind user:', error)
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'internal server error' })
        }
    }
}
export const handler = async (event) => {
    try {
        if (httpMethod === 'POST' && path === '/User/login') {
            let userData = JSON.parse(body);
            if (!userData.password || !userData.email) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ message: "email and password are required" })
                }
            }
            const res = await loginUser(userData);
            console.log(res);
            return res;
        }
        return {
            statusCode: 404,
            body: JSON.stringify({ message: "users not exist" })
        }
    }
    catch (error) {
        console.log(error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Internal Server Error'
            })
        }
    }
}




import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { GetCommand,UpdateCommand, DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb')
const client = new DynamoDBClient({ region: 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);
const { PutCommand } = require('@aws-sdk/lib-dynamodb')
const crypto = require('crypto');
const jwt=require('jsonwebtoken');
const SECRET_KEY=process.env.SECRET_KEY;
const JWT_EXPIRES_IN=process.env.JWT_EXPIRES_IN ;
const loginUser = async (userData) => {
    const { password, email } = userData;
    const hashedpassword = crypto.createHash('sha256').update(password).digest('hex')
    const params = {
        TableName: 'User',
        Key: { email }
    }
    try {
        const command = new GetCommand(params);
        const result = await docClient.send(command);
        if (result.Item && result.Item.password === hashedpassword) {
            const token =jwt.sign({email:result.Item.email},SECRET_KEY,{expiresIn:JWT_EXPIRES_IN})
            console.log('Generated Token:',token)
            const updateParams={
                TableName:'User',
                Key:{email},
                UpdateExpression:'set #token=:token',
                ExpressionAttributeNames:{
                    '#token':'token' 
                },
                ExpressionAttributeValues:{
                    ':token':token
                }
            }
           const updateCommand=new UpdateCommand(updateParams);
           await docClient.send(updateCommand);
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'login successful',token })

            }
        }
       
    }
    catch (error) {
        console.log('Error fetchind user:', error)
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'internal server error' })
        }
    }
}
const updateUser=async (userData)=>{
    const {email,newPassword,newUsername}=userData;
    const hashedPassword=crypto.createHash('sha256').update(newPassword).digest('hex');

    
    const params={
        TableName:'User',
        Key:{email:email},
        UpdateExpression:'set password=:newPassword,username=:newUsername',
        ExpressionAttributeValues:{
            ':newPassword':hashedPassword,
            ':newUsername':newUsername,
          
        },
        ReturnValues:'UPDATED_NEW'
    }
    try{
        const command =new UpdateCommand(params)
        const result=await docClient.send(command);
        return{
            statusCode:200,
            body:JSON.stringify({message:"user updated successful",updateAttributes:result.Attributes})
        }
        }catch(error){
            console.log('error updating user',error);
            return{
                statusCode:500,
                body:JSON.stringify({message:'Internal server error '})
            }
        }
        
    }

export const handler = async (event) => {
    try {
        const { httpMethod, path, body } = event
        if (event.httpMethod === 'POST' && path === '/User/Login') {
            let userData = JSON.parse(body);
            if (!userData.password || !userData.email) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ message: "email and password are required" })
                }
            }
            const res = await loginUser(userData);
            console.log(res);
            return res;
        }else if(event.httpMethod==='POST' && path==='/User/Update'){
        let userData=JSON.parse(body);
        return await updateUser(userData)
        }else{
            return{
                statusCode:404,
                body:JSON.stringify({message:"not found"})
            }
        }
        
    }
    catch (error) {
        console.log(error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Internal Server Error'
            })
        }
    }
}

    

