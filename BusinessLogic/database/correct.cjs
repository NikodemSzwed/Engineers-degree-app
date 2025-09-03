const fs = require('fs');

let content = fs.readFileSync('./BusinessLogicDatabases/models/init-models.js', 'utf8');
let contentNew = content.replace(/\.belongsTo\(([^,]+),\s*\{([^\}]*?)\}\)/g, (match, model, options) => {
    if (!options.includes('onDelete')) {
        options += `, onDelete: "CASCADE"`;
    }
    return `.belongsTo(${model}, {${options}})`;
});
fs.writeFileSync('./BusinessLogicDatabases/models/init-models.js', contentNew, 'utf8');
fs.writeFileSync('./BusinessLogicDatabases/models/init-models.js.old', content, 'utf8');
