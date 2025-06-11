const removePKandFieldsNotInModel = (input, model) => {
    let allowedFields = Object.keys(model.rawAttributes).filter(attr => !model.rawAttributes[attr].primaryKey);

    allowedFields = allowedFields.filter(field => field !== 'UUID');

    return Object.keys(input)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
            obj[key] = input[key];
            return obj;
        }, {});
};

module.exports = removePKandFieldsNotInModel;
