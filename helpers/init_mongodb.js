const mongoose = require('mongoose');

try {
    mongoose.connect(`${process.env.CONNECTION_STRING}`).then(() => {
        console.log(`MongoDB connected:`);
    });
} catch(error) {
    console.error(error);
    process.exit(1);
}

mongoose.connection.on('connected',() => {
    console.log('MongoDB connected to DB');
});

mongoose.connection.on('error', (err) => {
    console.log(err.message);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

process.on('SIGABRT', async() => {
    await mongoose.connection.close();
    process.exit(0);
})

