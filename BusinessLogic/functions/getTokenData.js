const express = require('express');
const jwt = require('jsonwebtoken');

function getTokenData(token) {
    return jwt.verify(token, process.env.JWT_SECRET || 'secret');
}

function getAllowedMaps(token) {
    const tokenData = getTokenData(token);
    return tokenData.userEIDs;
}

module.exports = {
    getTokenData,
    getAllowedMaps,
};
