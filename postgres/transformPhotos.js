/* eslint-disable camelcase */
/* eslint-disable no-loop-func */
/* eslint-disable no-restricted-syntax */
const fs = require('fs');
const { Client } = require('pg');

// make connection to Postgres databas
const postgres = new Client({
  user: 'benjis-brain',
  host: '/var/run/postgresql',
  database: 'product2',
  password: '',
  port: '5432',
});
postgres.connect().then(() => {
  console.log('connected');
});

// eslint-disable-next-line no-unused-vars
async function updateWithPhotos() {
  let first = true;
  try {
    const readStream = fs.createReadStream('../ProductsCSV/photos.csv', { encoding: 'utf-8' });
    let overflow = '';
    let unfinishedID = {};
    for await (const chunk of readStream) {
      /// Pull out chunk
      const rows = chunk.split('\n');
      if (first) {
        rows.shift();
        first = false;
      }
      // rows[0] = rows[0] + overflow;
      const newZero = overflow + rows[0];
      rows[0] = newZero;
      overflow = rows.pop();
      const collection = { ...unfinishedID };
      rows.forEach((row, index) => {
        const rowAr = row.split(',');
        const styleId = rowAr[1];
        const url = rowAr[2];
        const thumbnail_url = rowAr[3];
        if (collection[styleId] === undefined) {
          collection[styleId] = [JSON.stringify({ thumbnail_url, url })];
        } else {
          collection[styleId].push(JSON.stringify({ thumbnail_url, url }));
        }
        if (index === rows.length - 1) {
          unfinishedID = { [styleId]: collection[styleId] };
          delete collection[styleId];
        }
      });
      const promises = [];
      Object.entries(collection).forEach((entry) => {
        promises.push(postgres.query(
          'UPDATE stylesAPI SET photos = $2 WHERE id = $1;',
          [Number(entry[0]), entry[1]],
        ));
      });
      await Promise.all(promises);
    }
  } catch (error) {
    console.log(error);
  }
}
// updateWithPhotos();
