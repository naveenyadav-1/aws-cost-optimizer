 # AWS Cost Optimization Engine

I made this project to understand how AWS billing works and how we can 
reduce cloud costs. It fetches AWS cost data and shows which services 
are costing more, and gives suggestions to save money.

## Live Link
https://aws-cost-optimizer-90eg.onrender.com

## Why I made this
Cloud bills can get very high if you dont monitor them. 
This tool helps you see exactly where your money is going 
and what you can do to reduce it.

## What it does
- Shows total AWS cost for the month
- Breaks down cost by service (EC2, S3, Lambda etc)
- Shows a chart of last 6 months spending
- Gives suggestions like - stop unused EC2, change S3 storage class etc
- You can set a budget alert
- Has a filter to see specific services

## Tech I used
- HTML CSS JavaScript for frontend
- Node.js and Express for backend
- AWS SDK to connect with AWS
- Chart.js for the graphs
- Deployed on Render

## How to run it locally

first clone the repo

git clone https://github.com/naveenyadav-1/aws-cost-optimizer.git

then install packages

npm install

then start the server

npm start

open browser and go to http://localhost:3000/index.html

## AWS stuff used
- Cost Explorer API - to get billing data
- IAM - to create secure access keys
- EC2, S3, Lambda, RDS, EBS - these are the services being monitored

## Folder structure

backend/
  server.js          - main server file
  awsData.js         - fetches AWS data
  costAnalyzer.js    - calculates costs
  suggestionEngine.js - gives optimization tips

frontend/
  index.html         - main page
  css/style.css      - styling
  js/app.js          - frontend logic

## Author
Naveen Yadav