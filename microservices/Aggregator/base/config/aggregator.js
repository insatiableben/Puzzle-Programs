{
  "cache": {
    "setup": external or internal,
    "storage": {
      "strategy": singleEvent or multiEvent,
      "policy": {
        "archiveBy": secondaryEvent or time,
        "eventLimit": 10,
      },
      "eventTrigger": {
        "primaryEvent": ["Path","to","data","in","JSONObj"],
        "secondaryEvent": ["Path","to","data","in","JSONObj"] (Only needed if archiveBy is set to secondaryEvent)
      }
      "byteSizeWatermark": 1000000
    },
    "flushStrategy": single or multi
  }
}
