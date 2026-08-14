const url = new URL(process.env.DATABASE_URL!);
console.log("DB PATH:", url.pathname);
console.log("PREVIEW_DATABASE_URL:", process.env.PREVIEW_DATABASE_URL ? new URL(process.env.PREVIEW_DATABASE_URL).pathname : 'undefined');
