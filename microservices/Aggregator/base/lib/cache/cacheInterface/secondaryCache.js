/* eslint-env node */
/* eslint no-console:['error', { allow: ['info', 'error'] }] */

'use strict'

/*
* Module design:
*   This module will initialize the
*/

const createModule = require('./methods/createEntry.js')
const readModule = require('./methods/readEntry.js')
const updateModule = require('./methods/updateEntry.js')
const deleteModule = require('./methods/deleteEntry.js')
const bufferManagement = require('./utilities/bufferManagement.js')
const secondaryCacheManagement = require('./utilities/secondaryCacheManagement.js')

/*
* Description:
*
* Args:
*
* Returns:
*
* Throws:
*
* Notes:
*   N/A
* TODO:
*   [#1]:
*/

let addEntryToSecondCache = (that, primaryEventData, secondaryEventData, record) => {
  return (Promise.resolve()
    .then(() => createModule.createCacheEntry(that.cache, primaryEventData, {}))
    .then(() => bufferManagement.createBufferFromString(record))
    .then(buffer => updateModule.addValueToObj(that.cache[primaryEventData], secondaryEventData, buffer))
    .then(buffer => bufferManagement.getSizeOfBufferFromBuffer(buffer))
    .then(bufferSize => secondaryCacheManagement.increaseBufferSize(that.properties.sizeOfCache, bufferSize, primaryEventData, secondaryEventData))
    .then(() => secondaryCacheManagement.increaseEventSize(that.properties.numberOfEvents, primaryEventData, secondaryEventData))
    .catch(error => {
      throw error
    }))
}

/*
* Description:
*
* Args:
*
* Returns:
*
* Throws:
*
* Notes:
*   N/A
* TODO:
*   [#1]:
*/
// NEEDS to return the stored message since it needs to be handled by the microservice logic mainly acked so the message is removed from the microservice queue.
let updateEntryToSecondCache = (that, primaryEventData, secondaryEventData, record) => {
  return (Promise.resolve()
    .then(() => bufferManagement.createBufferFromString(record))
    .then(buffer => updateModule.addValueToObj(that.cache[primaryEventData], secondaryEventData, buffer))
    .then(buffer => bufferManagement.getSizeOfBufferFromBuffer(buffer))
    .then(bufferSize => secondaryCacheManagement.increaseBufferSize(that.properties.sizeOfCache, bufferSize, primaryEventData, secondaryEventData))
    .then(() => secondaryCacheManagement.increaseEventSize(that.properties.numberOfEvents, primaryEventData, secondaryEventData))
    .catch(error => {
      throw error
    }))
}

/*
* Description:
*
* Args:
*
* Returns:
*
* Throws:
*
* Notes:
*   N/A
* TODO:
*   [#1]:
*/

let doesCacheSecondaryNeedFlush = (that, mainEvent, secondaryEvent) => {
  return Promise.all([secondaryCacheManagement.getEventSize(that.properties.numberOfEvents, mainEvent, secondaryEvent), secondaryCacheManagement.getCacheSize(that.properties.sizeOfCache, mainEvent, secondaryEvent)])
    .then(results => {
      let eventSize = results[0]
      let cacheSize = results[1]
      if (eventSize >= that.config['storage']['policy']['eventLimit'] || cacheSize >= that.config['storage']['byteSizeWatermark']) {
        return true
      } else {
        return false
      }
    })
}

/*
* Description:
*
* Args:
*
* Returns:
*
* Throws:
*
* Notes:
*   N/A
* TODO:
*   [#1]:
*/

let flushSecondaryEventCache = (that, mainEvent, secondaryEvent) => {
  return (Promise.resolve()
    .then(() => secondaryCacheManagement.resetEventSize(that.properties.numberOfEvents, mainEvent, secondaryEvent))
    .then(() => secondaryCacheManagement.resetBufferSize(that.properties.sizeOfCache, mainEvent, secondaryEvent))
    .then(() => deleteModule.removeEntryObj(mainEvent, secondaryEvent, that.cache))
    .then(buffer => bufferManagement.getJSONFromBuffer(buffer))
    .catch(error => {
      throw error
    }))
}

/*
* Description:
*   This method searches for an entry in the cache that is the secondary event. This only makes sense
*     if used for secondary strorage policy.
* Args:
*   key (String): This String is the key that represents the primary event.
*   subkey (String): This String is the key that represents the secondary event.
*   cache (Object): This Object is the internal cache that is being searched
* Returns:
*   result (Promise): This promise resolves to the boolean value of whether the value exists in the cache
* Throws:
*   N/A
* Notes:
*   To work around a for loop that searchs the whole Object we suppose the value exists and change the boolean
*     statement if it is false.
* TODO:
*   [#1]:
*/

let hasSecondaryEntry = (key, subKey, cache) => {
  return Promise.resolve()
    .then(() => readModule.readPrimaryEntry(key, cache))
    .then(value => {
      if (value !== undefined) {
        return readModule.readSecondaryEntry(key, subKey, cache)
          .then(subValue => {
            if (subValue === undefined) {
              return false
            } else {
              return true
            }
          })
          .catch(error => {
            throw error
          })
      } else {
        return false
      }
    })
}

module.exports = {
  addEntryToSecondCache: addEntryToSecondCache,
  updateEntryToSecondCache: updateEntryToSecondCache,
  doesCacheSecondaryNeedFlush: doesCacheSecondaryNeedFlush,
  flushSecondaryEventCache: flushSecondaryEventCache,
  hasSecondaryEntry: hasSecondaryEntry
}