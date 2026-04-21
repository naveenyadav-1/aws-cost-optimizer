 function analyze(data) {
    let suggestions = [];

    data.services.forEach(service => {

        // EC2
        if(service.name.includes("EC2") && service.cost > 50){
            suggestions.push({
                text: "Stop idle EC2 instances",
                level: "high",
                saving: service.cost * 0.4
            });
        }

        // S3
        if(service.name.includes("S3") && service.cost > 20){
            suggestions.push({
                text: "Move S3 data to Glacier",
                level: "medium",
                saving: service.cost * 0.3
            });
        }

        // RDS
        if(service.name.includes("RDS") && service.cost > 30){
            suggestions.push({
                text: "Resize RDS instance",
                level: "medium",
                saving: service.cost * 0.25
            });
        }

    });

    return suggestions;
}

module.exports = { analyze };