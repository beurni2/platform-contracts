import type { Porte } from './portes.js';

/**
 * THE RECORDINGS — the doors of Shop+ and Séra that Boutik+'s screen walks
 * stand in for, each with the forms its real door gave in its producer's own
 * workerd suites. The forms are written by the producer's record run
 * (`scripts/certifier-reponses.mjs --enregistrer` in shop-plus and sera),
 * never by hand. A door with no form refuses every stand-in answer.
 */
export const ENREGISTREMENTS: readonly Porte[] = [
  {
    "producteur": "shop-plus",
    "methode": "GET",
    "chemin": "/checkout/dispatch",
    "formes": [
      {
        "statut": 200,
        "corps": {
          "t": "objet",
          "cles": {
            "next": {
              "t": "string"
            },
            "ok": {
              "t": "mot",
              "v": true
            },
            "orders": {
              "t": "liste",
              "de": [
                {
                  "t": "objet",
                  "cles": {
                    "contact": {
                      "t": "null"
                    },
                    "createdAt": {
                      "t": "string"
                    },
                    "exists": {
                      "t": "boolean"
                    },
                    "ok": {
                      "t": "mot",
                      "v": true
                    },
                    "orderId": {
                      "t": "string"
                    },
                    "productVersionId": {
                      "t": "string"
                    },
                    "remboursement": {
                      "t": "null"
                    },
                    "state": {
                      "t": "mot",
                      "v": "confirmed"
                    },
                    "zoneTo": {
                      "t": "string"
                    }
                  }
                },
                {
                  "t": "objet",
                  "cles": {
                    "contact": {
                      "t": "null"
                    },
                    "createdAt": {
                      "t": "string"
                    },
                    "exists": {
                      "t": "boolean"
                    },
                    "ok": {
                      "t": "mot",
                      "v": true
                    },
                    "orderId": {
                      "t": "string"
                    },
                    "productVersionId": {
                      "t": "string"
                    },
                    "remboursement": {
                      "t": "null"
                    },
                    "state": {
                      "t": "mot",
                      "v": "payment_pending"
                    },
                    "zoneTo": {
                      "t": "string"
                    }
                  }
                },
                {
                  "t": "objet",
                  "cles": {
                    "contact": {
                      "t": "objet",
                      "cles": {
                        "audioRef": {
                          "t": "string"
                        },
                        "phone": {
                          "t": "string"
                        },
                        "quartier": {
                          "t": "string"
                        },
                        "repere": {
                          "t": "string"
                        }
                      }
                    },
                    "createdAt": {
                      "t": "string"
                    },
                    "exists": {
                      "t": "boolean"
                    },
                    "ok": {
                      "t": "mot",
                      "v": true
                    },
                    "orderId": {
                      "t": "string"
                    },
                    "productVersionId": {
                      "t": "string"
                    },
                    "remboursement": {
                      "t": "null"
                    },
                    "state": {
                      "t": "mot",
                      "v": "confirmed"
                    },
                    "zoneTo": {
                      "t": "string"
                    }
                  }
                },
                {
                  "t": "objet",
                  "cles": {
                    "contact": {
                      "t": "objet",
                      "cles": {
                        "audioRef": {
                          "t": "string"
                        },
                        "phone": {
                          "t": "string"
                        },
                        "quartier": {
                          "t": "string"
                        },
                        "repere": {
                          "t": "string"
                        }
                      }
                    },
                    "createdAt": {
                      "t": "string"
                    },
                    "exists": {
                      "t": "boolean"
                    },
                    "ok": {
                      "t": "mot",
                      "v": true
                    },
                    "orderId": {
                      "t": "string"
                    },
                    "productVersionId": {
                      "t": "string"
                    },
                    "remboursement": {
                      "t": "null"
                    },
                    "state": {
                      "t": "mot",
                      "v": "payment_pending"
                    },
                    "zoneTo": {
                      "t": "string"
                    }
                  }
                },
                {
                  "t": "objet",
                  "cles": {
                    "contact": {
                      "t": "objet",
                      "cles": {
                        "phone": {
                          "t": "string"
                        },
                        "pin": {
                          "t": "objet",
                          "cles": {
                            "accuracy": {
                              "t": "number"
                            },
                            "lat": {
                              "t": "number"
                            },
                            "lng": {
                              "t": "number"
                            }
                          }
                        },
                        "quartier": {
                          "t": "string"
                        },
                        "repere": {
                          "t": "string"
                        }
                      }
                    },
                    "createdAt": {
                      "t": "string"
                    },
                    "exists": {
                      "t": "boolean"
                    },
                    "ok": {
                      "t": "mot",
                      "v": true
                    },
                    "orderId": {
                      "t": "string"
                    },
                    "productVersionId": {
                      "t": "string"
                    },
                    "remboursement": {
                      "t": "null"
                    },
                    "state": {
                      "t": "mot",
                      "v": "payment_pending"
                    },
                    "zoneTo": {
                      "t": "string"
                    }
                  }
                },
                {
                  "t": "objet",
                  "cles": {
                    "contact": {
                      "t": "objet",
                      "cles": {
                        "phone": {
                          "t": "string"
                        },
                        "pin": {
                          "t": "objet",
                          "cles": {
                            "lat": {
                              "t": "number"
                            },
                            "lng": {
                              "t": "number"
                            }
                          }
                        },
                        "quartier": {
                          "t": "string"
                        },
                        "repere": {
                          "t": "string"
                        }
                      }
                    },
                    "createdAt": {
                      "t": "string"
                    },
                    "exists": {
                      "t": "boolean"
                    },
                    "ok": {
                      "t": "mot",
                      "v": true
                    },
                    "orderId": {
                      "t": "string"
                    },
                    "productVersionId": {
                      "t": "string"
                    },
                    "remboursement": {
                      "t": "null"
                    },
                    "state": {
                      "t": "mot",
                      "v": "payment_pending"
                    },
                    "zoneTo": {
                      "t": "string"
                    }
                  }
                },
                {
                  "t": "objet",
                  "cles": {
                    "contact": {
                      "t": "objet",
                      "cles": {
                        "phone": {
                          "t": "string"
                        },
                        "quartier": {
                          "t": "string"
                        },
                        "repere": {
                          "t": "string"
                        }
                      }
                    },
                    "createdAt": {
                      "t": "string"
                    },
                    "exists": {
                      "t": "boolean"
                    },
                    "ok": {
                      "t": "mot",
                      "v": true
                    },
                    "orderId": {
                      "t": "string"
                    },
                    "productVersionId": {
                      "t": "string"
                    },
                    "remboursement": {
                      "t": "null"
                    },
                    "state": {
                      "t": "mot",
                      "v": "confirmed"
                    },
                    "zoneTo": {
                      "t": "string"
                    }
                  }
                },
                {
                  "t": "objet",
                  "cles": {
                    "contact": {
                      "t": "objet",
                      "cles": {
                        "phone": {
                          "t": "string"
                        },
                        "quartier": {
                          "t": "string"
                        },
                        "repere": {
                          "t": "string"
                        }
                      }
                    },
                    "createdAt": {
                      "t": "string"
                    },
                    "exists": {
                      "t": "boolean"
                    },
                    "ok": {
                      "t": "mot",
                      "v": true
                    },
                    "orderId": {
                      "t": "string"
                    },
                    "productVersionId": {
                      "t": "string"
                    },
                    "remboursement": {
                      "t": "null"
                    },
                    "state": {
                      "t": "mot",
                      "v": "payment_pending"
                    },
                    "zoneTo": {
                      "t": "string"
                    }
                  }
                },
                {
                  "t": "objet",
                  "cles": {
                    "contact": {
                      "t": "objet",
                      "cles": {
                        "phone": {
                          "t": "string"
                        },
                        "quartier": {
                          "t": "string"
                        },
                        "repere": {
                          "t": "string"
                        }
                      }
                    },
                    "createdAt": {
                      "t": "string"
                    },
                    "exists": {
                      "t": "boolean"
                    },
                    "ok": {
                      "t": "mot",
                      "v": true
                    },
                    "orderId": {
                      "t": "string"
                    },
                    "productVersionId": {
                      "t": "string"
                    },
                    "remboursement": {
                      "t": "objet",
                      "cles": {
                        "etat": {
                          "t": "mot",
                          "v": "bloque"
                        },
                        "raison": {
                          "t": "mot",
                          "v": "refus_du_prestataire"
                        }
                      }
                    },
                    "state": {
                      "t": "mot",
                      "v": "confirmed"
                    },
                    "zoneTo": {
                      "t": "string"
                    }
                  }
                },
                {
                  "t": "objet",
                  "cles": {
                    "contact": {
                      "t": "objet",
                      "cles": {
                        "phone": {
                          "t": "string"
                        },
                        "quartier": {
                          "t": "string"
                        },
                        "repere": {
                          "t": "string"
                        }
                      }
                    },
                    "createdAt": {
                      "t": "string"
                    },
                    "exists": {
                      "t": "boolean"
                    },
                    "ok": {
                      "t": "mot",
                      "v": true
                    },
                    "orderId": {
                      "t": "string"
                    },
                    "productVersionId": {
                      "t": "string"
                    },
                    "remboursement": {
                      "t": "objet",
                      "cles": {
                        "etat": {
                          "t": "mot",
                          "v": "bloque"
                        },
                        "raison": {
                          "t": "mot",
                          "v": "sans_confirmation"
                        }
                      }
                    },
                    "state": {
                      "t": "mot",
                      "v": "refunded"
                    },
                    "zoneTo": {
                      "t": "string"
                    }
                  }
                },
                {
                  "t": "objet",
                  "cles": {
                    "contact": {
                      "t": "objet",
                      "cles": {
                        "phone": {
                          "t": "string"
                        },
                        "quartier": {
                          "t": "string"
                        },
                        "repere": {
                          "t": "string"
                        }
                      }
                    },
                    "createdAt": {
                      "t": "string"
                    },
                    "exists": {
                      "t": "boolean"
                    },
                    "ok": {
                      "t": "mot",
                      "v": true
                    },
                    "orderId": {
                      "t": "string"
                    },
                    "productVersionId": {
                      "t": "string"
                    },
                    "remboursement": {
                      "t": "objet",
                      "cles": {
                        "etat": {
                          "t": "mot",
                          "v": "en_cours"
                        }
                      }
                    },
                    "state": {
                      "t": "mot",
                      "v": "confirmed"
                    },
                    "zoneTo": {
                      "t": "string"
                    }
                  }
                },
                {
                  "t": "objet",
                  "cles": {
                    "contact": {
                      "t": "objet",
                      "cles": {
                        "phone": {
                          "t": "string"
                        },
                        "quartier": {
                          "t": "string"
                        },
                        "repere": {
                          "t": "string"
                        }
                      }
                    },
                    "createdAt": {
                      "t": "string"
                    },
                    "exists": {
                      "t": "boolean"
                    },
                    "ok": {
                      "t": "mot",
                      "v": true
                    },
                    "orderId": {
                      "t": "string"
                    },
                    "productVersionId": {
                      "t": "string"
                    },
                    "remboursement": {
                      "t": "objet",
                      "cles": {
                        "etat": {
                          "t": "mot",
                          "v": "fait"
                        }
                      }
                    },
                    "state": {
                      "t": "mot",
                      "v": "refunded"
                    },
                    "zoneTo": {
                      "t": "string"
                    }
                  }
                },
                {
                  "t": "objet",
                  "cles": {
                    "contact": {
                      "t": "objet",
                      "cles": {
                        "phone": {
                          "t": "string"
                        },
                        "quartier": {
                          "t": "string"
                        },
                        "repere": {
                          "t": "string"
                        }
                      }
                    },
                    "createdAt": {
                      "t": "string"
                    },
                    "exists": {
                      "t": "boolean"
                    },
                    "ok": {
                      "t": "mot",
                      "v": true
                    },
                    "orderId": {
                      "t": "string"
                    },
                    "productVersionId": {
                      "t": "string"
                    },
                    "remboursement": {
                      "t": "objet",
                      "cles": {
                        "etat": {
                          "t": "mot",
                          "v": "rien"
                        }
                      }
                    },
                    "state": {
                      "t": "mot",
                      "v": "confirmed"
                    },
                    "zoneTo": {
                      "t": "string"
                    }
                  }
                }
              ]
            }
          }
        }
      },
      {
        "statut": 200,
        "corps": {
          "t": "objet",
          "cles": {
            "ok": {
              "t": "mot",
              "v": true
            },
            "orders": {
              "t": "liste",
              "de": [
                {
                  "t": "objet",
                  "cles": {
                    "contact": {
                      "t": "null"
                    },
                    "createdAt": {
                      "t": "string"
                    },
                    "exists": {
                      "t": "boolean"
                    },
                    "ok": {
                      "t": "mot",
                      "v": true
                    },
                    "orderId": {
                      "t": "string"
                    },
                    "productVersionId": {
                      "t": "string"
                    },
                    "remboursement": {
                      "t": "null"
                    },
                    "state": {
                      "t": "mot",
                      "v": "confirmed"
                    },
                    "zoneTo": {
                      "t": "string"
                    }
                  }
                },
                {
                  "t": "objet",
                  "cles": {
                    "contact": {
                      "t": "null"
                    },
                    "createdAt": {
                      "t": "string"
                    },
                    "exists": {
                      "t": "boolean"
                    },
                    "ok": {
                      "t": "mot",
                      "v": true
                    },
                    "orderId": {
                      "t": "string"
                    },
                    "productVersionId": {
                      "t": "string"
                    },
                    "remboursement": {
                      "t": "null"
                    },
                    "state": {
                      "t": "mot",
                      "v": "payment_pending"
                    },
                    "zoneTo": {
                      "t": "string"
                    }
                  }
                },
                {
                  "t": "objet",
                  "cles": {
                    "contact": {
                      "t": "objet",
                      "cles": {
                        "audioRef": {
                          "t": "string"
                        },
                        "phone": {
                          "t": "string"
                        },
                        "quartier": {
                          "t": "string"
                        },
                        "repere": {
                          "t": "string"
                        }
                      }
                    },
                    "createdAt": {
                      "t": "string"
                    },
                    "exists": {
                      "t": "boolean"
                    },
                    "ok": {
                      "t": "mot",
                      "v": true
                    },
                    "orderId": {
                      "t": "string"
                    },
                    "productVersionId": {
                      "t": "string"
                    },
                    "remboursement": {
                      "t": "null"
                    },
                    "state": {
                      "t": "mot",
                      "v": "confirmed"
                    },
                    "zoneTo": {
                      "t": "string"
                    }
                  }
                },
                {
                  "t": "objet",
                  "cles": {
                    "contact": {
                      "t": "objet",
                      "cles": {
                        "audioRef": {
                          "t": "string"
                        },
                        "phone": {
                          "t": "string"
                        },
                        "quartier": {
                          "t": "string"
                        },
                        "repere": {
                          "t": "string"
                        }
                      }
                    },
                    "createdAt": {
                      "t": "string"
                    },
                    "exists": {
                      "t": "boolean"
                    },
                    "ok": {
                      "t": "mot",
                      "v": true
                    },
                    "orderId": {
                      "t": "string"
                    },
                    "productVersionId": {
                      "t": "string"
                    },
                    "remboursement": {
                      "t": "null"
                    },
                    "state": {
                      "t": "mot",
                      "v": "payment_pending"
                    },
                    "zoneTo": {
                      "t": "string"
                    }
                  }
                },
                {
                  "t": "objet",
                  "cles": {
                    "contact": {
                      "t": "objet",
                      "cles": {
                        "phone": {
                          "t": "string"
                        },
                        "pin": {
                          "t": "objet",
                          "cles": {
                            "accuracy": {
                              "t": "number"
                            },
                            "lat": {
                              "t": "number"
                            },
                            "lng": {
                              "t": "number"
                            }
                          }
                        },
                        "quartier": {
                          "t": "string"
                        },
                        "repere": {
                          "t": "string"
                        }
                      }
                    },
                    "createdAt": {
                      "t": "string"
                    },
                    "exists": {
                      "t": "boolean"
                    },
                    "ok": {
                      "t": "mot",
                      "v": true
                    },
                    "orderId": {
                      "t": "string"
                    },
                    "productVersionId": {
                      "t": "string"
                    },
                    "remboursement": {
                      "t": "null"
                    },
                    "state": {
                      "t": "mot",
                      "v": "payment_pending"
                    },
                    "zoneTo": {
                      "t": "string"
                    }
                  }
                },
                {
                  "t": "objet",
                  "cles": {
                    "contact": {
                      "t": "objet",
                      "cles": {
                        "phone": {
                          "t": "string"
                        },
                        "pin": {
                          "t": "objet",
                          "cles": {
                            "lat": {
                              "t": "number"
                            },
                            "lng": {
                              "t": "number"
                            }
                          }
                        },
                        "quartier": {
                          "t": "string"
                        },
                        "repere": {
                          "t": "string"
                        }
                      }
                    },
                    "createdAt": {
                      "t": "string"
                    },
                    "exists": {
                      "t": "boolean"
                    },
                    "ok": {
                      "t": "mot",
                      "v": true
                    },
                    "orderId": {
                      "t": "string"
                    },
                    "productVersionId": {
                      "t": "string"
                    },
                    "remboursement": {
                      "t": "null"
                    },
                    "state": {
                      "t": "mot",
                      "v": "payment_pending"
                    },
                    "zoneTo": {
                      "t": "string"
                    }
                  }
                },
                {
                  "t": "objet",
                  "cles": {
                    "contact": {
                      "t": "objet",
                      "cles": {
                        "phone": {
                          "t": "string"
                        },
                        "quartier": {
                          "t": "string"
                        },
                        "repere": {
                          "t": "string"
                        }
                      }
                    },
                    "createdAt": {
                      "t": "string"
                    },
                    "exists": {
                      "t": "boolean"
                    },
                    "ok": {
                      "t": "mot",
                      "v": true
                    },
                    "orderId": {
                      "t": "string"
                    },
                    "productVersionId": {
                      "t": "string"
                    },
                    "remboursement": {
                      "t": "null"
                    },
                    "state": {
                      "t": "mot",
                      "v": "confirmed"
                    },
                    "zoneTo": {
                      "t": "string"
                    }
                  }
                },
                {
                  "t": "objet",
                  "cles": {
                    "contact": {
                      "t": "objet",
                      "cles": {
                        "phone": {
                          "t": "string"
                        },
                        "quartier": {
                          "t": "string"
                        },
                        "repere": {
                          "t": "string"
                        }
                      }
                    },
                    "createdAt": {
                      "t": "string"
                    },
                    "exists": {
                      "t": "boolean"
                    },
                    "ok": {
                      "t": "mot",
                      "v": true
                    },
                    "orderId": {
                      "t": "string"
                    },
                    "productVersionId": {
                      "t": "string"
                    },
                    "remboursement": {
                      "t": "null"
                    },
                    "state": {
                      "t": "mot",
                      "v": "payment_pending"
                    },
                    "zoneTo": {
                      "t": "string"
                    }
                  }
                },
                {
                  "t": "objet",
                  "cles": {
                    "contact": {
                      "t": "objet",
                      "cles": {
                        "phone": {
                          "t": "string"
                        },
                        "quartier": {
                          "t": "string"
                        },
                        "repere": {
                          "t": "string"
                        }
                      }
                    },
                    "createdAt": {
                      "t": "string"
                    },
                    "exists": {
                      "t": "boolean"
                    },
                    "ok": {
                      "t": "mot",
                      "v": true
                    },
                    "orderId": {
                      "t": "string"
                    },
                    "productVersionId": {
                      "t": "string"
                    },
                    "remboursement": {
                      "t": "objet",
                      "cles": {
                        "etat": {
                          "t": "mot",
                          "v": "bloque"
                        },
                        "raison": {
                          "t": "mot",
                          "v": "refus_du_prestataire"
                        }
                      }
                    },
                    "state": {
                      "t": "mot",
                      "v": "confirmed"
                    },
                    "zoneTo": {
                      "t": "string"
                    }
                  }
                },
                {
                  "t": "objet",
                  "cles": {
                    "contact": {
                      "t": "objet",
                      "cles": {
                        "phone": {
                          "t": "string"
                        },
                        "quartier": {
                          "t": "string"
                        },
                        "repere": {
                          "t": "string"
                        }
                      }
                    },
                    "createdAt": {
                      "t": "string"
                    },
                    "exists": {
                      "t": "boolean"
                    },
                    "ok": {
                      "t": "mot",
                      "v": true
                    },
                    "orderId": {
                      "t": "string"
                    },
                    "productVersionId": {
                      "t": "string"
                    },
                    "remboursement": {
                      "t": "objet",
                      "cles": {
                        "etat": {
                          "t": "mot",
                          "v": "bloque"
                        },
                        "raison": {
                          "t": "mot",
                          "v": "sans_confirmation"
                        }
                      }
                    },
                    "state": {
                      "t": "mot",
                      "v": "refunded"
                    },
                    "zoneTo": {
                      "t": "string"
                    }
                  }
                },
                {
                  "t": "objet",
                  "cles": {
                    "contact": {
                      "t": "objet",
                      "cles": {
                        "phone": {
                          "t": "string"
                        },
                        "quartier": {
                          "t": "string"
                        },
                        "repere": {
                          "t": "string"
                        }
                      }
                    },
                    "createdAt": {
                      "t": "string"
                    },
                    "exists": {
                      "t": "boolean"
                    },
                    "ok": {
                      "t": "mot",
                      "v": true
                    },
                    "orderId": {
                      "t": "string"
                    },
                    "productVersionId": {
                      "t": "string"
                    },
                    "remboursement": {
                      "t": "objet",
                      "cles": {
                        "etat": {
                          "t": "mot",
                          "v": "en_cours"
                        }
                      }
                    },
                    "state": {
                      "t": "mot",
                      "v": "confirmed"
                    },
                    "zoneTo": {
                      "t": "string"
                    }
                  }
                },
                {
                  "t": "objet",
                  "cles": {
                    "contact": {
                      "t": "objet",
                      "cles": {
                        "phone": {
                          "t": "string"
                        },
                        "quartier": {
                          "t": "string"
                        },
                        "repere": {
                          "t": "string"
                        }
                      }
                    },
                    "createdAt": {
                      "t": "string"
                    },
                    "exists": {
                      "t": "boolean"
                    },
                    "ok": {
                      "t": "mot",
                      "v": true
                    },
                    "orderId": {
                      "t": "string"
                    },
                    "productVersionId": {
                      "t": "string"
                    },
                    "remboursement": {
                      "t": "objet",
                      "cles": {
                        "etat": {
                          "t": "mot",
                          "v": "fait"
                        }
                      }
                    },
                    "state": {
                      "t": "mot",
                      "v": "refunded"
                    },
                    "zoneTo": {
                      "t": "string"
                    }
                  }
                },
                {
                  "t": "objet",
                  "cles": {
                    "contact": {
                      "t": "objet",
                      "cles": {
                        "phone": {
                          "t": "string"
                        },
                        "quartier": {
                          "t": "string"
                        },
                        "repere": {
                          "t": "string"
                        }
                      }
                    },
                    "createdAt": {
                      "t": "string"
                    },
                    "exists": {
                      "t": "boolean"
                    },
                    "ok": {
                      "t": "mot",
                      "v": true
                    },
                    "orderId": {
                      "t": "string"
                    },
                    "productVersionId": {
                      "t": "string"
                    },
                    "remboursement": {
                      "t": "objet",
                      "cles": {
                        "etat": {
                          "t": "mot",
                          "v": "rien"
                        }
                      }
                    },
                    "state": {
                      "t": "mot",
                      "v": "confirmed"
                    },
                    "zoneTo": {
                      "t": "string"
                    }
                  }
                }
              ]
            }
          }
        }
      },
      {
        "statut": 400,
        "corps": {
          "t": "objet",
          "cles": {
            "ok": {
              "t": "mot",
              "v": false
            },
            "reason": {
              "t": "mot",
              "v": "malformed"
            }
          }
        }
      },
      {
        "statut": 401,
        "corps": {
          "t": "objet",
          "cles": {
            "error": {
              "t": "mot",
              "v": "unauthorized"
            }
          }
        }
      }
    ]
  },
  {
    "producteur": "shop-plus",
    "methode": "POST",
    "chemin": "/checkout/dispatch/:orderId/refusal",
    "formes": [
      {
        "statut": 200,
        "corps": {
          "t": "objet",
          "cles": {
            "escalated": {
              "t": "boolean"
            },
            "ok": {
              "t": "mot",
              "v": true
            },
            "record": {
              "t": "objet",
              "cles": {
                "buyerRef": {
                  "t": "string"
                },
                "buyerRefusalCount": {
                  "t": "number"
                },
                "buyerRiskState": {
                  "t": "string"
                },
                "prepayOnlyUntil": {
                  "t": "string"
                },
                "reason": {
                  "t": "mot",
                  "v": "change_of_mind"
                },
                "requiredDeposit": {
                  "t": "number"
                },
                "state": {
                  "t": "mot",
                  "v": "allowed"
                }
              }
            },
            "rung": {
              "t": "mot",
              "v": "prepay_only_window"
            }
          }
        }
      },
      {
        "statut": 200,
        "corps": {
          "t": "objet",
          "cles": {
            "escalated": {
              "t": "boolean"
            },
            "ok": {
              "t": "mot",
              "v": true
            },
            "record": {
              "t": "objet",
              "cles": {
                "buyerRef": {
                  "t": "string"
                },
                "buyerRefusalCount": {
                  "t": "number"
                },
                "buyerRiskState": {
                  "t": "string"
                },
                "prepayOnlyUntil": {
                  "t": "string"
                },
                "reason": {
                  "t": "mot",
                  "v": "insufficient_balance"
                },
                "requiredDeposit": {
                  "t": "number"
                },
                "state": {
                  "t": "mot",
                  "v": "allowed"
                }
              }
            },
            "rung": {
              "t": "mot",
              "v": "prepay_only_window"
            }
          }
        }
      },
      {
        "statut": 200,
        "corps": {
          "t": "objet",
          "cles": {
            "escalated": {
              "t": "boolean"
            },
            "ok": {
              "t": "mot",
              "v": true
            },
            "record": {
              "t": "objet",
              "cles": {
                "buyerRef": {
                  "t": "string"
                },
                "buyerRefusalCount": {
                  "t": "number"
                },
                "buyerRiskState": {
                  "t": "string"
                },
                "reason": {
                  "t": "mot",
                  "v": "change_of_mind"
                },
                "requiredDeposit": {
                  "t": "number"
                },
                "state": {
                  "t": "mot",
                  "v": "allowed"
                }
              }
            },
            "replay": {
              "t": "boolean"
            },
            "rung": {
              "t": "mot",
              "v": "first_fault_recorded"
            }
          }
        }
      },
      {
        "statut": 200,
        "corps": {
          "t": "objet",
          "cles": {
            "escalated": {
              "t": "boolean"
            },
            "ok": {
              "t": "mot",
              "v": true
            },
            "record": {
              "t": "objet",
              "cles": {
                "buyerRef": {
                  "t": "string"
                },
                "buyerRefusalCount": {
                  "t": "number"
                },
                "buyerRiskState": {
                  "t": "string"
                },
                "reason": {
                  "t": "mot",
                  "v": "change_of_mind"
                },
                "requiredDeposit": {
                  "t": "number"
                },
                "state": {
                  "t": "mot",
                  "v": "allowed"
                }
              }
            },
            "rung": {
              "t": "mot",
              "v": "first_fault_recorded"
            }
          }
        }
      },
      {
        "statut": 400,
        "corps": {
          "t": "objet",
          "cles": {
            "field": {
              "t": "mot",
              "v": "phone"
            },
            "ok": {
              "t": "mot",
              "v": false
            },
            "reason": {
              "t": "mot",
              "v": "unknown_field"
            }
          }
        }
      },
      {
        "statut": 400,
        "corps": {
          "t": "objet",
          "cles": {
            "field": {
              "t": "mot",
              "v": "reason"
            },
            "ok": {
              "t": "mot",
              "v": false
            },
            "reason": {
              "t": "mot",
              "v": "bad_field"
            }
          }
        }
      },
      {
        "statut": 401,
        "corps": {
          "t": "objet",
          "cles": {
            "error": {
              "t": "mot",
              "v": "unauthorized"
            }
          }
        }
      },
      {
        "statut": 404,
        "corps": {
          "t": "objet",
          "cles": {
            "ok": {
              "t": "mot",
              "v": false
            },
            "reason": {
              "t": "mot",
              "v": "not_found"
            }
          }
        }
      },
      {
        "statut": 409,
        "corps": {
          "t": "objet",
          "cles": {
            "ok": {
              "t": "mot",
              "v": false
            },
            "reason": {
              "t": "mot",
              "v": "already_recorded"
            },
            "recorded": {
              "t": "mot",
              "v": "change_of_mind"
            }
          }
        }
      },
      {
        "statut": 422,
        "corps": {
          "t": "objet",
          "cles": {
            "ok": {
              "t": "mot",
              "v": false
            },
            "reason": {
              "t": "mot",
              "v": "no_contact_on_order"
            }
          }
        }
      }
    ]
  },
  {
    "producteur": "shop-plus",
    "methode": "GET",
    "chemin": "/checkout/gains",
    "formes": [
      {
        "statut": 200,
        "corps": {
          "t": "objet",
          "cles": {
            "gains": {
              "t": "liste",
              "de": [
                {
                  "t": "objet",
                  "cles": {
                    "createdAt": {
                      "t": "string"
                    },
                    "exists": {
                      "t": "boolean"
                    },
                    "livree": {
                      "t": "boolean"
                    },
                    "obligations": {
                      "t": "liste",
                      "de": [
                        {
                          "t": "objet",
                          "cles": {
                            "amount": {
                              "t": "number"
                            },
                            "party": {
                              "t": "string"
                            },
                            "state": {
                              "t": "mot",
                              "v": "Eligible"
                            }
                          }
                        }
                      ]
                    },
                    "ok": {
                      "t": "mot",
                      "v": true
                    },
                    "orderId": {
                      "t": "string"
                    },
                    "productVersionId": {
                      "t": "string"
                    },
                    "split": {
                      "t": "objet",
                      "cles": {
                        "buyerTotal": {
                          "t": "number"
                        },
                        "deliveryFee": {
                          "t": "number"
                        },
                        "productSubtotal": {
                          "t": "number"
                        },
                        "resellerMarkup": {
                          "t": "number"
                        },
                        "resellerNet": {
                          "t": "number"
                        },
                        "resellerPlatformFee": {
                          "t": "number"
                        },
                        "sellerBasePrice": {
                          "t": "number"
                        },
                        "sellerFundedCommission": {
                          "t": "number"
                        },
                        "sellerNet": {
                          "t": "number"
                        },
                        "sellerPlatformFee": {
                          "t": "number"
                        }
                      }
                    },
                    "state": {
                      "t": "mot",
                      "v": "confirmed"
                    },
                    "zoneTo": {
                      "t": "string"
                    }
                  }
                }
              ]
            },
            "next": {
              "t": "string"
            },
            "ok": {
              "t": "mot",
              "v": true
            }
          }
        }
      },
      {
        "statut": 200,
        "corps": {
          "t": "objet",
          "cles": {
            "gains": {
              "t": "liste",
              "de": [
                {
                  "t": "objet",
                  "cles": {
                    "createdAt": {
                      "t": "string"
                    },
                    "exists": {
                      "t": "boolean"
                    },
                    "livree": {
                      "t": "boolean"
                    },
                    "obligations": {
                      "t": "liste",
                      "de": [
                        {
                          "t": "objet",
                          "cles": {
                            "amount": {
                              "t": "number"
                            },
                            "party": {
                              "t": "string"
                            },
                            "state": {
                              "t": "mot",
                              "v": "Eligible"
                            }
                          }
                        }
                      ]
                    },
                    "ok": {
                      "t": "mot",
                      "v": true
                    },
                    "orderId": {
                      "t": "string"
                    },
                    "productVersionId": {
                      "t": "string"
                    },
                    "split": {
                      "t": "objet",
                      "cles": {
                        "buyerTotal": {
                          "t": "number"
                        },
                        "deliveryFee": {
                          "t": "number"
                        },
                        "productSubtotal": {
                          "t": "number"
                        },
                        "resellerMarkup": {
                          "t": "number"
                        },
                        "resellerNet": {
                          "t": "number"
                        },
                        "resellerPlatformFee": {
                          "t": "number"
                        },
                        "sellerBasePrice": {
                          "t": "number"
                        },
                        "sellerFundedCommission": {
                          "t": "number"
                        },
                        "sellerNet": {
                          "t": "number"
                        },
                        "sellerPlatformFee": {
                          "t": "number"
                        }
                      }
                    },
                    "state": {
                      "t": "mot",
                      "v": "confirmed"
                    },
                    "zoneTo": {
                      "t": "string"
                    }
                  }
                }
              ]
            },
            "ok": {
              "t": "mot",
              "v": true
            }
          }
        }
      },
      {
        "statut": 401,
        "corps": {
          "t": "objet",
          "cles": {
            "error": {
              "t": "mot",
              "v": "unauthorized"
            }
          }
        }
      }
    ]
  },
  {
    "producteur": "shop-plus",
    "methode": "GET",
    "chemin": "/reseller/suivi",
    "formes": [
      {
        "statut": 200,
        "corps": {
          "t": "objet",
          "cles": {
            "lignes": {
              "t": "liste",
              "de": [
                {
                  "t": "objet",
                  "cles": {
                    "accountId": {
                      "t": "string"
                    },
                    "incomplet": {
                      "t": "boolean"
                    },
                    "misesDeCote": {
                      "t": "objet",
                      "cles": {
                        "n": {
                          "t": "number"
                        },
                        "netFcfa": {
                          "t": "number"
                        }
                      }
                    },
                    "name": {
                      "t": "string"
                    },
                    "netFcfa": {
                      "t": "number"
                    },
                    "state": {
                      "t": "mot",
                      "v": "active"
                    },
                    "ventes": {
                      "t": "number"
                    }
                  }
                },
                {
                  "t": "objet",
                  "cles": {
                    "accountId": {
                      "t": "string"
                    },
                    "incomplet": {
                      "t": "boolean"
                    },
                    "name": {
                      "t": "string"
                    },
                    "netFcfa": {
                      "t": "number"
                    },
                    "state": {
                      "t": "mot",
                      "v": "active"
                    },
                    "suite": {
                      "t": "boolean"
                    },
                    "ventes": {
                      "t": "number"
                    }
                  }
                },
                {
                  "t": "objet",
                  "cles": {
                    "accountId": {
                      "t": "string"
                    },
                    "incomplet": {
                      "t": "boolean"
                    },
                    "name": {
                      "t": "string"
                    },
                    "netFcfa": {
                      "t": "number"
                    },
                    "state": {
                      "t": "mot",
                      "v": "active"
                    },
                    "ventes": {
                      "t": "number"
                    }
                  }
                },
                {
                  "t": "objet",
                  "cles": {
                    "accountId": {
                      "t": "string"
                    },
                    "incomplet": {
                      "t": "boolean"
                    },
                    "name": {
                      "t": "string"
                    },
                    "netFcfa": {
                      "t": "number"
                    },
                    "state": {
                      "t": "mot",
                      "v": "paused"
                    },
                    "ventes": {
                      "t": "number"
                    }
                  }
                },
                {
                  "t": "objet",
                  "cles": {
                    "accountId": {
                      "t": "string"
                    },
                    "incomplet": {
                      "t": "boolean"
                    },
                    "name": {
                      "t": "string"
                    },
                    "netFcfa": {
                      "t": "number"
                    },
                    "state": {
                      "t": "mot",
                      "v": "pending_access"
                    },
                    "ventes": {
                      "t": "number"
                    }
                  }
                }
              ]
            },
            "next": {
              "t": "string"
            },
            "ok": {
              "t": "mot",
              "v": true
            },
            "total": {
              "t": "number"
            }
          }
        }
      },
      {
        "statut": 200,
        "corps": {
          "t": "objet",
          "cles": {
            "lignes": {
              "t": "liste",
              "de": [
                {
                  "t": "objet",
                  "cles": {
                    "accountId": {
                      "t": "string"
                    },
                    "incomplet": {
                      "t": "boolean"
                    },
                    "misesDeCote": {
                      "t": "objet",
                      "cles": {
                        "n": {
                          "t": "number"
                        },
                        "netFcfa": {
                          "t": "number"
                        }
                      }
                    },
                    "name": {
                      "t": "string"
                    },
                    "netFcfa": {
                      "t": "number"
                    },
                    "state": {
                      "t": "mot",
                      "v": "active"
                    },
                    "ventes": {
                      "t": "number"
                    }
                  }
                },
                {
                  "t": "objet",
                  "cles": {
                    "accountId": {
                      "t": "string"
                    },
                    "incomplet": {
                      "t": "boolean"
                    },
                    "name": {
                      "t": "string"
                    },
                    "netFcfa": {
                      "t": "number"
                    },
                    "state": {
                      "t": "mot",
                      "v": "active"
                    },
                    "suite": {
                      "t": "boolean"
                    },
                    "ventes": {
                      "t": "number"
                    }
                  }
                },
                {
                  "t": "objet",
                  "cles": {
                    "accountId": {
                      "t": "string"
                    },
                    "incomplet": {
                      "t": "boolean"
                    },
                    "name": {
                      "t": "string"
                    },
                    "netFcfa": {
                      "t": "number"
                    },
                    "state": {
                      "t": "mot",
                      "v": "active"
                    },
                    "ventes": {
                      "t": "number"
                    }
                  }
                },
                {
                  "t": "objet",
                  "cles": {
                    "accountId": {
                      "t": "string"
                    },
                    "incomplet": {
                      "t": "boolean"
                    },
                    "name": {
                      "t": "string"
                    },
                    "netFcfa": {
                      "t": "number"
                    },
                    "state": {
                      "t": "mot",
                      "v": "paused"
                    },
                    "ventes": {
                      "t": "number"
                    }
                  }
                },
                {
                  "t": "objet",
                  "cles": {
                    "accountId": {
                      "t": "string"
                    },
                    "incomplet": {
                      "t": "boolean"
                    },
                    "name": {
                      "t": "string"
                    },
                    "netFcfa": {
                      "t": "number"
                    },
                    "state": {
                      "t": "mot",
                      "v": "pending_access"
                    },
                    "ventes": {
                      "t": "number"
                    }
                  }
                }
              ]
            },
            "ok": {
              "t": "mot",
              "v": true
            },
            "total": {
              "t": "number"
            }
          }
        }
      },
      {
        "statut": 200,
        "corps": {
          "t": "objet",
          "cles": {
            "lignes": {
              "t": "liste",
              "de": [
                {
                  "t": "objet",
                  "cles": {
                    "accountId": {
                      "t": "string"
                    },
                    "incomplet": {
                      "t": "boolean"
                    },
                    "misesDeCote": {
                      "t": "objet",
                      "cles": {
                        "n": {
                          "t": "number"
                        },
                        "netFcfa": {
                          "t": "number"
                        }
                      }
                    },
                    "name": {
                      "t": "string"
                    },
                    "netFcfa": {
                      "t": "number"
                    },
                    "state": {
                      "t": "mot",
                      "v": "active"
                    },
                    "ventes": {
                      "t": "number"
                    }
                  }
                },
                {
                  "t": "objet",
                  "cles": {
                    "accountId": {
                      "t": "string"
                    },
                    "incomplet": {
                      "t": "boolean"
                    },
                    "name": {
                      "t": "string"
                    },
                    "netFcfa": {
                      "t": "number"
                    },
                    "state": {
                      "t": "mot",
                      "v": "active"
                    },
                    "suite": {
                      "t": "boolean"
                    },
                    "ventes": {
                      "t": "number"
                    }
                  }
                },
                {
                  "t": "objet",
                  "cles": {
                    "accountId": {
                      "t": "string"
                    },
                    "incomplet": {
                      "t": "boolean"
                    },
                    "name": {
                      "t": "string"
                    },
                    "netFcfa": {
                      "t": "number"
                    },
                    "state": {
                      "t": "mot",
                      "v": "active"
                    },
                    "ventes": {
                      "t": "number"
                    }
                  }
                },
                {
                  "t": "objet",
                  "cles": {
                    "accountId": {
                      "t": "string"
                    },
                    "incomplet": {
                      "t": "boolean"
                    },
                    "name": {
                      "t": "string"
                    },
                    "netFcfa": {
                      "t": "number"
                    },
                    "state": {
                      "t": "mot",
                      "v": "paused"
                    },
                    "ventes": {
                      "t": "number"
                    }
                  }
                },
                {
                  "t": "objet",
                  "cles": {
                    "accountId": {
                      "t": "string"
                    },
                    "incomplet": {
                      "t": "boolean"
                    },
                    "name": {
                      "t": "string"
                    },
                    "netFcfa": {
                      "t": "number"
                    },
                    "state": {
                      "t": "mot",
                      "v": "pending_access"
                    },
                    "ventes": {
                      "t": "number"
                    }
                  }
                }
              ]
            },
            "ok": {
              "t": "mot",
              "v": true
            }
          }
        }
      },
      {
        "statut": 401,
        "corps": {
          "t": "objet",
          "cles": {
            "error": {
              "t": "mot",
              "v": "unauthorized"
            }
          }
        }
      },
      {
        "statut": 409,
        "corps": {
          "t": "objet",
          "cles": {
            "ok": {
              "t": "mot",
              "v": false
            },
            "reason": {
              "t": "mot",
              "v": "curseur_perdu"
            }
          }
        }
      }
    ]
  },
  {
    "producteur": "shop-plus",
    "methode": "GET",
    "chemin": "/reseller/codes",
    "formes": [
      {
        "statut": 200,
        "corps": {
          "t": "objet",
          "cles": {
            "codes": {
              "t": "liste",
              "de": [
                {
                  "t": "objet",
                  "cles": {
                    "mintedAt": {
                      "t": "string"
                    },
                    "resellerId": {
                      "t": "string"
                    },
                    "revelable": {
                      "t": "boolean"
                    }
                  }
                }
              ]
            },
            "ok": {
              "t": "mot",
              "v": true
            }
          }
        }
      },
      {
        "statut": 401,
        "corps": {
          "t": "objet",
          "cles": {
            "error": {
              "t": "mot",
              "v": "unauthorized"
            }
          }
        }
      }
    ]
  },
  {
    "producteur": "shop-plus",
    "methode": "GET",
    "chemin": "/reseller/accounts",
    "formes": [
      {
        "statut": 200,
        "corps": {
          "t": "objet",
          "cles": {
            "accounts": {
              "t": "liste",
              "de": [
                {
                  "t": "objet",
                  "cles": {
                    "accessCodePending": {
                      "t": "boolean"
                    },
                    "accessCodeRevelable": {
                      "t": "boolean"
                    },
                    "accountId": {
                      "t": "string"
                    },
                    "categories": {
                      "t": "liste",
                      "de": [
                        {
                          "t": "string"
                        }
                      ]
                    },
                    "createdAt": {
                      "t": "string"
                    },
                    "email": {
                      "t": "string"
                    },
                    "name": {
                      "t": "string"
                    },
                    "phone": {
                      "t": "string"
                    },
                    "state": {
                      "t": "mot",
                      "v": "active"
                    }
                  }
                },
                {
                  "t": "objet",
                  "cles": {
                    "accessCodePending": {
                      "t": "boolean"
                    },
                    "accessCodeRevelable": {
                      "t": "boolean"
                    },
                    "accountId": {
                      "t": "string"
                    },
                    "categories": {
                      "t": "liste",
                      "de": [
                        {
                          "t": "string"
                        }
                      ]
                    },
                    "createdAt": {
                      "t": "string"
                    },
                    "email": {
                      "t": "string"
                    },
                    "name": {
                      "t": "string"
                    },
                    "phone": {
                      "t": "string"
                    },
                    "state": {
                      "t": "mot",
                      "v": "pending_access"
                    }
                  }
                },
                {
                  "t": "objet",
                  "cles": {
                    "accessCodePending": {
                      "t": "boolean"
                    },
                    "accessCodeRevelable": {
                      "t": "boolean"
                    },
                    "accountId": {
                      "t": "string"
                    },
                    "createdAt": {
                      "t": "string"
                    },
                    "email": {
                      "t": "string"
                    },
                    "name": {
                      "t": "string"
                    },
                    "phone": {
                      "t": "string"
                    },
                    "state": {
                      "t": "mot",
                      "v": "active"
                    }
                  }
                },
                {
                  "t": "objet",
                  "cles": {
                    "accessCodePending": {
                      "t": "boolean"
                    },
                    "accessCodeRevelable": {
                      "t": "boolean"
                    },
                    "accountId": {
                      "t": "string"
                    },
                    "createdAt": {
                      "t": "string"
                    },
                    "email": {
                      "t": "string"
                    },
                    "name": {
                      "t": "string"
                    },
                    "phone": {
                      "t": "string"
                    },
                    "state": {
                      "t": "mot",
                      "v": "paused"
                    }
                  }
                },
                {
                  "t": "objet",
                  "cles": {
                    "accessCodePending": {
                      "t": "boolean"
                    },
                    "accessCodeRevelable": {
                      "t": "boolean"
                    },
                    "accountId": {
                      "t": "string"
                    },
                    "createdAt": {
                      "t": "string"
                    },
                    "email": {
                      "t": "string"
                    },
                    "name": {
                      "t": "string"
                    },
                    "phone": {
                      "t": "string"
                    },
                    "state": {
                      "t": "mot",
                      "v": "pending_access"
                    }
                  }
                }
              ]
            },
            "ok": {
              "t": "mot",
              "v": true
            }
          }
        }
      },
      {
        "statut": 401,
        "corps": {
          "t": "objet",
          "cles": {
            "error": {
              "t": "mot",
              "v": "unauthorized"
            }
          }
        }
      }
    ]
  },
  {
    "producteur": "shop-plus",
    "methode": "POST",
    "chemin": "/buyer/accounts/recovery-code",
    "formes": [
      {
        "statut": 200,
        "corps": {
          "t": "objet",
          "cles": {
            "code": {
              "t": "string"
            },
            "expiresAt": {
              "t": "string"
            },
            "ok": {
              "t": "mot",
              "v": true
            }
          }
        }
      },
      {
        "statut": 400,
        "corps": {
          "t": "objet",
          "cles": {
            "field": {
              "t": "mot",
              "v": "phone"
            },
            "ok": {
              "t": "mot",
              "v": false
            },
            "reason": {
              "t": "mot",
              "v": "bad_field"
            }
          }
        }
      },
      {
        "statut": 401,
        "corps": {
          "t": "objet",
          "cles": {
            "error": {
              "t": "mot",
              "v": "unauthorized"
            }
          }
        }
      },
      {
        "statut": 404,
        "corps": {
          "t": "objet",
          "cles": {
            "ok": {
              "t": "mot",
              "v": false
            },
            "reason": {
              "t": "mot",
              "v": "no_account"
            }
          }
        }
      }
    ]
  },
  {
    "producteur": "shop-plus",
    "methode": "POST",
    "chemin": "/reseller/accounts/access-code",
    "formes": [
      {
        "statut": 200,
        "corps": {
          "t": "objet",
          "cles": {
            "accountId": {
              "t": "string"
            },
            "code": {
              "t": "string"
            },
            "ok": {
              "t": "mot",
              "v": true
            }
          }
        }
      },
      {
        "statut": 401,
        "corps": {
          "t": "objet",
          "cles": {
            "error": {
              "t": "mot",
              "v": "unauthorized"
            }
          }
        }
      },
      {
        "statut": 404,
        "corps": {
          "t": "objet",
          "cles": {
            "ok": {
              "t": "mot",
              "v": false
            },
            "reason": {
              "t": "mot",
              "v": "not_found"
            }
          }
        }
      },
      {
        "statut": 409,
        "corps": {
          "t": "objet",
          "cles": {
            "ok": {
              "t": "mot",
              "v": false
            },
            "reason": {
              "t": "mot",
              "v": "not_pending"
            }
          }
        }
      }
    ]
  },
  {
    "producteur": "shop-plus",
    "methode": "POST",
    "chemin": "/reseller/accounts/pause",
    "formes": [
      {
        "statut": 200,
        "corps": {
          "t": "objet",
          "cles": {
            "accountId": {
              "t": "string"
            },
            "ok": {
              "t": "mot",
              "v": true
            },
            "state": {
              "t": "mot",
              "v": "paused"
            }
          }
        }
      },
      {
        "statut": 401,
        "corps": {
          "t": "objet",
          "cles": {
            "error": {
              "t": "mot",
              "v": "unauthorized"
            }
          }
        }
      },
      {
        "statut": 409,
        "corps": {
          "t": "objet",
          "cles": {
            "ok": {
              "t": "mot",
              "v": false
            },
            "reason": {
              "t": "mot",
              "v": "wrong_state"
            },
            "state": {
              "t": "mot",
              "v": "pending_access"
            }
          }
        }
      }
    ]
  },
  {
    "producteur": "shop-plus",
    "methode": "POST",
    "chemin": "/reseller/code",
    "formes": [
      {
        "statut": 200,
        "corps": {
          "t": "objet",
          "cles": {
            "code": {
              "t": "string"
            },
            "mintedAt": {
              "t": "string"
            },
            "ok": {
              "t": "mot",
              "v": true
            },
            "resellerId": {
              "t": "string"
            }
          }
        }
      },
      {
        "statut": 400,
        "corps": {
          "t": "objet",
          "cles": {
            "ok": {
              "t": "mot",
              "v": false
            },
            "reason": {
              "t": "mot",
              "v": "malformed"
            }
          }
        }
      },
      {
        "statut": 401,
        "corps": {
          "t": "objet",
          "cles": {
            "error": {
              "t": "mot",
              "v": "unauthorized"
            }
          }
        }
      }
    ]
  },
  {
    "producteur": "sera",
    "methode": "GET",
    "chemin": "/ops/board",
    "formes": [
      {
        "statut": 200,
        "corps": {
          "t": "objet",
          "cles": {
            "board": {
              "t": "objet",
              "cles": {
                "aReprogrammer": {
                  "t": "liste",
                  "de": [
                    {
                      "t": "objet",
                      "cles": {
                        "assignmentId": {
                          "t": "string"
                        },
                        "orderId": {
                          "t": "string"
                        },
                        "reasonCode": {
                          "t": "string"
                        },
                        "recordedAt": {
                          "t": "string"
                        },
                        "riderId": {
                          "t": "string"
                        },
                        "taskId": {
                          "t": "string"
                        }
                      }
                    }
                  ]
                },
                "assignments": {
                  "t": "liste",
                  "de": [
                    {
                      "t": "objet",
                      "cles": {
                        "ackDeadline": {
                          "t": "string"
                        },
                        "assignedAt": {
                          "t": "string"
                        },
                        "assignmentId": {
                          "t": "string"
                        },
                        "correlationId": {
                          "t": "string"
                        },
                        "dispatcherId": {
                          "t": "string"
                        },
                        "lease": {
                          "t": "objet",
                          "cles": {
                            "riderId": {
                              "t": "string"
                            },
                            "taskId": {
                              "t": "string"
                            },
                            "version": {
                              "t": "number"
                            }
                          }
                        },
                        "orderId": {
                          "t": "string"
                        },
                        "riderId": {
                          "t": "string"
                        },
                        "status": {
                          "t": "mot",
                          "v": "acknowledged"
                        },
                        "taskId": {
                          "t": "string"
                        }
                      }
                    },
                    {
                      "t": "objet",
                      "cles": {
                        "ackDeadline": {
                          "t": "string"
                        },
                        "assignedAt": {
                          "t": "string"
                        },
                        "assignmentId": {
                          "t": "string"
                        },
                        "correlationId": {
                          "t": "string"
                        },
                        "dispatcherId": {
                          "t": "string"
                        },
                        "lease": {
                          "t": "objet",
                          "cles": {
                            "riderId": {
                              "t": "string"
                            },
                            "taskId": {
                              "t": "string"
                            },
                            "version": {
                              "t": "number"
                            }
                          }
                        },
                        "orderId": {
                          "t": "string"
                        },
                        "riderId": {
                          "t": "string"
                        },
                        "status": {
                          "t": "mot",
                          "v": "active_unacknowledged"
                        },
                        "taskId": {
                          "t": "string"
                        }
                      }
                    }
                  ]
                },
                "colisEnCourse": {
                  "t": "dico",
                  "de": [
                    {
                      "t": "objet",
                      "cles": {
                        "orderIds": {
                          "t": "liste",
                          "de": [
                            {
                              "t": "string"
                            }
                          ]
                        },
                        "packageId": {
                          "t": "string"
                        },
                        "reglement": {
                          "t": "dico",
                          "de": [
                            {
                              "t": "string"
                            }
                          ]
                        }
                      }
                    }
                  ]
                },
                "enDeuxiemePassage": {
                  "t": "liste",
                  "de": [
                    {
                      "t": "objet",
                      "cles": {
                        "assignmentId": {
                          "t": "string"
                        },
                        "orderId": {
                          "t": "string"
                        },
                        "passage": {
                          "t": "number"
                        },
                        "riderId": {
                          "t": "string"
                        },
                        "taskId": {
                          "t": "string"
                        },
                        "window": {
                          "t": "objet",
                          "cles": {
                            "end": {
                              "t": "string"
                            },
                            "start": {
                              "t": "string"
                            }
                          }
                        }
                      }
                    }
                  ]
                },
                "finDeService": {
                  "t": "dico",
                  "de": [
                    {
                      "t": "objet",
                      "cles": {
                        "at": {
                          "t": "string"
                        },
                        "dispatcherAckId": {
                          "t": "string"
                        },
                        "dispatcherId": {
                          "t": "string"
                        },
                        "nextOwner": {
                          "t": "objet",
                          "cles": {
                            "kind": {
                              "t": "mot",
                              "v": "reassignment"
                            },
                            "ref": {
                              "t": "string"
                            }
                          }
                        },
                        "packageIds": {
                          "t": "liste",
                          "de": [
                            {
                              "t": "string"
                            }
                          ]
                        }
                      }
                    },
                    {
                      "t": "objet",
                      "cles": {
                        "at": {
                          "t": "string"
                        },
                        "dispatcherAckId": {
                          "t": "string"
                        },
                        "dispatcherId": {
                          "t": "string"
                        },
                        "nextOwner": {
                          "t": "objet",
                          "cles": {
                            "kind": {
                              "t": "mot",
                              "v": "return_to_hub_task"
                            },
                            "ref": {
                              "t": "string"
                            }
                          }
                        },
                        "packageIds": {
                          "t": "liste",
                          "de": [
                            {
                              "t": "string"
                            }
                          ]
                        }
                      }
                    }
                  ]
                },
                "manifestes": {
                  "t": "dico",
                  "de": [
                    {
                      "t": "objet",
                      "cles": {
                        "currentStop": {
                          "t": "null"
                        },
                        "custodyInventory": {
                          "t": "liste",
                          "de": [
                            {
                              "t": "string"
                            }
                          ]
                        },
                        "custodyReadings": {
                          "t": "liste",
                          "de": [
                            {
                              "t": "objet",
                              "cles": {
                                "asOf": {
                                  "t": "null"
                                },
                                "orderId": {
                                  "t": "string"
                                },
                                "reading": {
                                  "t": "string"
                                }
                              }
                            },
                            {
                              "t": "objet",
                              "cles": {
                                "asOf": {
                                  "t": "string"
                                },
                                "orderId": {
                                  "t": "string"
                                },
                                "reading": {
                                  "t": "string"
                                }
                              }
                            }
                          ]
                        },
                        "id": {
                          "t": "string"
                        },
                        "orderedStops": {
                          "t": "liste",
                          "de": [
                            {
                              "t": "string"
                            }
                          ]
                        },
                        "riderId": {
                          "t": "string"
                        },
                        "status": {
                          "t": "mot",
                          "v": "active"
                        },
                        "stops": {
                          "t": "liste",
                          "de": [
                            {
                              "t": "objet",
                              "cles": {
                                "assignmentId": {
                                  "t": "string"
                                },
                                "kind": {
                                  "t": "mot",
                                  "v": "livraison"
                                },
                                "orderId": {
                                  "t": "string"
                                },
                                "stopId": {
                                  "t": "string"
                                },
                                "taskId": {
                                  "t": "string"
                                }
                              }
                            },
                            {
                              "t": "objet",
                              "cles": {
                                "assignmentId": {
                                  "t": "string"
                                },
                                "kind": {
                                  "t": "mot",
                                  "v": "ramassage"
                                },
                                "orderId": {
                                  "t": "string"
                                },
                                "stopId": {
                                  "t": "string"
                                },
                                "taskId": {
                                  "t": "string"
                                }
                              }
                            },
                            {
                              "t": "objet",
                              "cles": {
                                "assignmentId": {
                                  "t": "string"
                                },
                                "kind": {
                                  "t": "mot",
                                  "v": "retour"
                                },
                                "orderId": {
                                  "t": "string"
                                },
                                "stopId": {
                                  "t": "string"
                                },
                                "taskId": {
                                  "t": "string"
                                }
                              }
                            }
                          ]
                        },
                        "version": {
                          "t": "number"
                        }
                      }
                    },
                    {
                      "t": "objet",
                      "cles": {
                        "currentStop": {
                          "t": "objet",
                          "cles": {
                            "assignmentId": {
                              "t": "string"
                            },
                            "kind": {
                              "t": "mot",
                              "v": "livraison"
                            },
                            "orderId": {
                              "t": "string"
                            },
                            "stopId": {
                              "t": "string"
                            },
                            "taskId": {
                              "t": "string"
                            }
                          }
                        },
                        "custodyInventory": {
                          "t": "liste",
                          "de": [
                            {
                              "t": "string"
                            }
                          ]
                        },
                        "custodyReadings": {
                          "t": "liste",
                          "de": [
                            {
                              "t": "objet",
                              "cles": {
                                "asOf": {
                                  "t": "null"
                                },
                                "orderId": {
                                  "t": "string"
                                },
                                "reading": {
                                  "t": "string"
                                }
                              }
                            },
                            {
                              "t": "objet",
                              "cles": {
                                "asOf": {
                                  "t": "string"
                                },
                                "orderId": {
                                  "t": "string"
                                },
                                "reading": {
                                  "t": "string"
                                }
                              }
                            }
                          ]
                        },
                        "id": {
                          "t": "string"
                        },
                        "orderedStops": {
                          "t": "liste",
                          "de": [
                            {
                              "t": "string"
                            }
                          ]
                        },
                        "riderId": {
                          "t": "string"
                        },
                        "status": {
                          "t": "mot",
                          "v": "active"
                        },
                        "stops": {
                          "t": "liste",
                          "de": [
                            {
                              "t": "objet",
                              "cles": {
                                "assignmentId": {
                                  "t": "string"
                                },
                                "kind": {
                                  "t": "mot",
                                  "v": "livraison"
                                },
                                "orderId": {
                                  "t": "string"
                                },
                                "stopId": {
                                  "t": "string"
                                },
                                "taskId": {
                                  "t": "string"
                                }
                              }
                            },
                            {
                              "t": "objet",
                              "cles": {
                                "assignmentId": {
                                  "t": "string"
                                },
                                "kind": {
                                  "t": "mot",
                                  "v": "ramassage"
                                },
                                "orderId": {
                                  "t": "string"
                                },
                                "stopId": {
                                  "t": "string"
                                },
                                "taskId": {
                                  "t": "string"
                                }
                              }
                            },
                            {
                              "t": "objet",
                              "cles": {
                                "assignmentId": {
                                  "t": "string"
                                },
                                "kind": {
                                  "t": "mot",
                                  "v": "retour"
                                },
                                "orderId": {
                                  "t": "string"
                                },
                                "stopId": {
                                  "t": "string"
                                },
                                "taskId": {
                                  "t": "string"
                                }
                              }
                            }
                          ]
                        },
                        "version": {
                          "t": "number"
                        }
                      }
                    },
                    {
                      "t": "objet",
                      "cles": {
                        "currentStop": {
                          "t": "objet",
                          "cles": {
                            "assignmentId": {
                              "t": "string"
                            },
                            "kind": {
                              "t": "mot",
                              "v": "ramassage"
                            },
                            "orderId": {
                              "t": "string"
                            },
                            "stopId": {
                              "t": "string"
                            },
                            "taskId": {
                              "t": "string"
                            }
                          }
                        },
                        "custodyInventory": {
                          "t": "liste",
                          "de": [
                            {
                              "t": "string"
                            }
                          ]
                        },
                        "custodyReadings": {
                          "t": "liste",
                          "de": [
                            {
                              "t": "objet",
                              "cles": {
                                "asOf": {
                                  "t": "null"
                                },
                                "orderId": {
                                  "t": "string"
                                },
                                "reading": {
                                  "t": "string"
                                }
                              }
                            },
                            {
                              "t": "objet",
                              "cles": {
                                "asOf": {
                                  "t": "string"
                                },
                                "orderId": {
                                  "t": "string"
                                },
                                "reading": {
                                  "t": "string"
                                }
                              }
                            }
                          ]
                        },
                        "id": {
                          "t": "string"
                        },
                        "orderedStops": {
                          "t": "liste",
                          "de": [
                            {
                              "t": "string"
                            }
                          ]
                        },
                        "riderId": {
                          "t": "string"
                        },
                        "status": {
                          "t": "mot",
                          "v": "active"
                        },
                        "stops": {
                          "t": "liste",
                          "de": [
                            {
                              "t": "objet",
                              "cles": {
                                "assignmentId": {
                                  "t": "string"
                                },
                                "kind": {
                                  "t": "mot",
                                  "v": "livraison"
                                },
                                "orderId": {
                                  "t": "string"
                                },
                                "stopId": {
                                  "t": "string"
                                },
                                "taskId": {
                                  "t": "string"
                                }
                              }
                            },
                            {
                              "t": "objet",
                              "cles": {
                                "assignmentId": {
                                  "t": "string"
                                },
                                "kind": {
                                  "t": "mot",
                                  "v": "ramassage"
                                },
                                "orderId": {
                                  "t": "string"
                                },
                                "stopId": {
                                  "t": "string"
                                },
                                "taskId": {
                                  "t": "string"
                                }
                              }
                            },
                            {
                              "t": "objet",
                              "cles": {
                                "assignmentId": {
                                  "t": "string"
                                },
                                "kind": {
                                  "t": "mot",
                                  "v": "retour"
                                },
                                "orderId": {
                                  "t": "string"
                                },
                                "stopId": {
                                  "t": "string"
                                },
                                "taskId": {
                                  "t": "string"
                                }
                              }
                            }
                          ]
                        },
                        "version": {
                          "t": "number"
                        }
                      }
                    },
                    {
                      "t": "objet",
                      "cles": {
                        "currentStop": {
                          "t": "objet",
                          "cles": {
                            "assignmentId": {
                              "t": "string"
                            },
                            "kind": {
                              "t": "mot",
                              "v": "retour"
                            },
                            "orderId": {
                              "t": "string"
                            },
                            "stopId": {
                              "t": "string"
                            },
                            "taskId": {
                              "t": "string"
                            }
                          }
                        },
                        "custodyInventory": {
                          "t": "liste",
                          "de": [
                            {
                              "t": "string"
                            }
                          ]
                        },
                        "custodyReadings": {
                          "t": "liste",
                          "de": [
                            {
                              "t": "objet",
                              "cles": {
                                "asOf": {
                                  "t": "null"
                                },
                                "orderId": {
                                  "t": "string"
                                },
                                "reading": {
                                  "t": "string"
                                }
                              }
                            },
                            {
                              "t": "objet",
                              "cles": {
                                "asOf": {
                                  "t": "string"
                                },
                                "orderId": {
                                  "t": "string"
                                },
                                "reading": {
                                  "t": "string"
                                }
                              }
                            }
                          ]
                        },
                        "id": {
                          "t": "string"
                        },
                        "orderedStops": {
                          "t": "liste",
                          "de": [
                            {
                              "t": "string"
                            }
                          ]
                        },
                        "riderId": {
                          "t": "string"
                        },
                        "status": {
                          "t": "mot",
                          "v": "active"
                        },
                        "stops": {
                          "t": "liste",
                          "de": [
                            {
                              "t": "objet",
                              "cles": {
                                "assignmentId": {
                                  "t": "string"
                                },
                                "kind": {
                                  "t": "mot",
                                  "v": "livraison"
                                },
                                "orderId": {
                                  "t": "string"
                                },
                                "stopId": {
                                  "t": "string"
                                },
                                "taskId": {
                                  "t": "string"
                                }
                              }
                            },
                            {
                              "t": "objet",
                              "cles": {
                                "assignmentId": {
                                  "t": "string"
                                },
                                "kind": {
                                  "t": "mot",
                                  "v": "ramassage"
                                },
                                "orderId": {
                                  "t": "string"
                                },
                                "stopId": {
                                  "t": "string"
                                },
                                "taskId": {
                                  "t": "string"
                                }
                              }
                            },
                            {
                              "t": "objet",
                              "cles": {
                                "assignmentId": {
                                  "t": "string"
                                },
                                "kind": {
                                  "t": "mot",
                                  "v": "retour"
                                },
                                "orderId": {
                                  "t": "string"
                                },
                                "stopId": {
                                  "t": "string"
                                },
                                "taskId": {
                                  "t": "string"
                                }
                              }
                            }
                          ]
                        },
                        "version": {
                          "t": "number"
                        }
                      }
                    }
                  ]
                },
                "queued": {
                  "t": "liste",
                  "de": [
                    {
                      "t": "objet",
                      "cles": {
                        "admittedAt": {
                          "t": "string"
                        },
                        "colis": {
                          "t": "objet",
                          "cles": {
                            "orderIds": {
                              "t": "liste",
                              "de": [
                                {
                                  "t": "string"
                                }
                              ]
                            }
                          }
                        },
                        "location": {
                          "t": "objet",
                          "cles": {
                            "directions": {
                              "t": "string"
                            },
                            "landmark": {
                              "t": "string"
                            },
                            "maskedRelay": {
                              "t": "string"
                            },
                            "zone": {
                              "t": "string"
                            }
                          }
                        },
                        "orderId": {
                          "t": "string"
                        },
                        "taskId": {
                          "t": "string"
                        },
                        "window": {
                          "t": "objet",
                          "cles": {
                            "end": {
                              "t": "string"
                            },
                            "start": {
                              "t": "string"
                            }
                          }
                        }
                      }
                    },
                    {
                      "t": "objet",
                      "cles": {
                        "admittedAt": {
                          "t": "string"
                        },
                        "location": {
                          "t": "objet",
                          "cles": {
                            "directions": {
                              "t": "string"
                            },
                            "landmark": {
                              "t": "string"
                            },
                            "maskedRelay": {
                              "t": "string"
                            },
                            "pin": {
                              "t": "objet",
                              "cles": {
                                "lat": {
                                  "t": "number"
                                },
                                "lng": {
                                  "t": "number"
                                }
                              }
                            },
                            "zone": {
                              "t": "string"
                            }
                          }
                        },
                        "orderId": {
                          "t": "string"
                        },
                        "taskId": {
                          "t": "string"
                        },
                        "window": {
                          "t": "objet",
                          "cles": {
                            "end": {
                              "t": "string"
                            },
                            "start": {
                              "t": "string"
                            }
                          }
                        }
                      }
                    },
                    {
                      "t": "objet",
                      "cles": {
                        "admittedAt": {
                          "t": "string"
                        },
                        "location": {
                          "t": "objet",
                          "cles": {
                            "directions": {
                              "t": "string"
                            },
                            "landmark": {
                              "t": "string"
                            },
                            "maskedRelay": {
                              "t": "string"
                            },
                            "zone": {
                              "t": "string"
                            }
                          }
                        },
                        "orderId": {
                          "t": "string"
                        },
                        "taskId": {
                          "t": "string"
                        },
                        "window": {
                          "t": "objet",
                          "cles": {
                            "end": {
                              "t": "string"
                            },
                            "start": {
                              "t": "string"
                            }
                          }
                        }
                      }
                    }
                  ]
                },
                "riders": {
                  "t": "liste",
                  "de": [
                    {
                      "t": "objet",
                      "cles": {
                        "assignable": {
                          "t": "boolean"
                        },
                        "certified": {
                          "t": "boolean"
                        },
                        "displayName": {
                          "t": "string"
                        },
                        "phoneAlias": {
                          "t": "string"
                        },
                        "privacyAck": {
                          "t": "objet",
                          "cles": {
                            "ackAt": {
                              "t": "string"
                            },
                            "noticeVersion": {
                              "t": "string"
                            }
                          }
                        },
                        "riderId": {
                          "t": "string"
                        },
                        "shift": {
                          "t": "objet",
                          "cles": {
                            "confirmedBy": {
                              "t": "string"
                            },
                            "startedAt": {
                              "t": "string"
                            },
                            "status": {
                              "t": "mot",
                              "v": "on_shift"
                            }
                          }
                        }
                      }
                    },
                    {
                      "t": "objet",
                      "cles": {
                        "assignable": {
                          "t": "boolean"
                        },
                        "certified": {
                          "t": "boolean"
                        },
                        "displayName": {
                          "t": "string"
                        },
                        "phoneAlias": {
                          "t": "string"
                        },
                        "privacyAck": {
                          "t": "objet",
                          "cles": {
                            "ackAt": {
                              "t": "string"
                            },
                            "noticeVersion": {
                              "t": "string"
                            }
                          }
                        },
                        "riderId": {
                          "t": "string"
                        },
                        "shift": {
                          "t": "objet",
                          "cles": {
                            "status": {
                              "t": "mot",
                              "v": "off_shift"
                            }
                          }
                        }
                      }
                    },
                    {
                      "t": "objet",
                      "cles": {
                        "assignable": {
                          "t": "boolean"
                        },
                        "certified": {
                          "t": "boolean"
                        },
                        "displayName": {
                          "t": "string"
                        },
                        "phoneAlias": {
                          "t": "string"
                        },
                        "riderId": {
                          "t": "string"
                        },
                        "shift": {
                          "t": "objet",
                          "cles": {
                            "status": {
                              "t": "mot",
                              "v": "off_shift"
                            }
                          }
                        }
                      }
                    }
                  ]
                }
              }
            },
            "ok": {
              "t": "mot",
              "v": true
            }
          }
        }
      },
      {
        "statut": 401,
        "corps": {
          "t": "objet",
          "cles": {
            "error": {
              "t": "mot",
              "v": "unauthorized"
            }
          }
        }
      }
    ]
  },
  {
    "producteur": "sera",
    "methode": "POST",
    "chemin": "/ops/task",
    "formes": [
      {
        "statut": 200,
        "corps": {
          "t": "objet",
          "cles": {
            "admitted": {
              "t": "boolean"
            },
            "colis": {
              "t": "objet",
              "cles": {
                "orderIds": {
                  "t": "liste",
                  "de": [
                    {
                      "t": "string"
                    }
                  ]
                }
              }
            },
            "duplicate": {
              "t": "boolean"
            },
            "ok": {
              "t": "mot",
              "v": true
            },
            "taskId": {
              "t": "string"
            }
          }
        }
      },
      {
        "statut": 200,
        "corps": {
          "t": "objet",
          "cles": {
            "admitted": {
              "t": "boolean"
            },
            "duplicate": {
              "t": "boolean"
            },
            "ok": {
              "t": "mot",
              "v": true
            },
            "taskId": {
              "t": "string"
            }
          }
        }
      },
      {
        "statut": 400,
        "corps": {
          "t": "objet",
          "cles": {
            "ok": {
              "t": "mot",
              "v": false
            },
            "reason": {
              "t": "mot",
              "v": "articles_malformed"
            }
          }
        }
      },
      {
        "statut": 400,
        "corps": {
          "t": "objet",
          "cles": {
            "ok": {
              "t": "mot",
              "v": false
            },
            "reason": {
              "t": "mot",
              "v": "malformed"
            }
          }
        }
      },
      {
        "statut": 400,
        "corps": {
          "t": "objet",
          "cles": {
            "ok": {
              "t": "mot",
              "v": false
            },
            "reason": {
              "t": "mot",
              "v": "preuve_photo_refs_malformed"
            }
          }
        }
      },
      {
        "statut": 400,
        "corps": {
          "t": "objet",
          "cles": {
            "ok": {
              "t": "mot",
              "v": false
            },
            "reason": {
              "t": "mot",
              "v": "repere_audio_ref_malformed"
            }
          }
        }
      },
      {
        "statut": 400,
        "corps": {
          "t": "objet",
          "cles": {
            "ok": {
              "t": "mot",
              "v": false
            },
            "reason": {
              "t": "mot",
              "v": "task_id_is_not_yours_to_choose"
            }
          }
        }
      },
      {
        "statut": 401,
        "corps": {
          "t": "objet",
          "cles": {
            "error": {
              "t": "mot",
              "v": "unauthorized"
            }
          }
        }
      },
      {
        "statut": 409,
        "corps": {
          "t": "objet",
          "cles": {
            "ok": {
              "t": "mot",
              "v": false
            },
            "reason": {
              "t": "mot",
              "v": "order_already_has_task"
            },
            "status": {
              "t": "mot",
              "v": "assigned"
            },
            "taskId": {
              "t": "string"
            }
          }
        }
      },
      {
        "statut": 409,
        "corps": {
          "t": "objet",
          "cles": {
            "ok": {
              "t": "mot",
              "v": false
            },
            "reason": {
              "t": "mot",
              "v": "order_already_has_task"
            },
            "status": {
              "t": "mot",
              "v": "queued"
            },
            "taskId": {
              "t": "string"
            }
          }
        }
      },
      {
        "statut": 422,
        "corps": {
          "t": "objet",
          "cles": {
            "admitted": {
              "t": "boolean"
            },
            "ok": {
              "t": "mot",
              "v": false
            },
            "reason": {
              "t": "mot",
              "v": "colis_fournisseurs_differents"
            }
          }
        }
      },
      {
        "statut": 422,
        "corps": {
          "t": "objet",
          "cles": {
            "admitted": {
              "t": "boolean"
            },
            "ok": {
              "t": "mot",
              "v": false
            },
            "reason": {
              "t": "mot",
              "v": "colis_incomplet"
            }
          }
        }
      },
      {
        "statut": 422,
        "corps": {
          "t": "objet",
          "cles": {
            "admitted": {
              "t": "boolean"
            },
            "ok": {
              "t": "mot",
              "v": false
            },
            "reason": {
              "t": "mot",
              "v": "funding_projection_stale"
            }
          }
        }
      },
      {
        "statut": 422,
        "corps": {
          "t": "objet",
          "cles": {
            "admitted": {
              "t": "boolean"
            },
            "ok": {
              "t": "mot",
              "v": false
            },
            "reason": {
              "t": "mot",
              "v": "readiness_projection_stale"
            }
          }
        }
      }
    ]
  },
  {
    "producteur": "sera",
    "methode": "POST",
    "chemin": "/ops/order/retirer",
    "formes": [
      {
        "statut": 200,
        "corps": {
          "t": "objet",
          "cles": {
            "ok": {
              "t": "mot",
              "v": true
            },
            "removed": {
              "t": "objet",
              "cles": {
                "assignments": {
                  "t": "number"
                },
                "briefs": {
                  "t": "number"
                },
                "codesVerification": {
                  "t": "number"
                },
                "custodyOutbox": {
                  "t": "number"
                },
                "funding": {
                  "t": "number"
                },
                "leases": {
                  "t": "number"
                },
                "ramassage": {
                  "t": "number"
                },
                "readiness": {
                  "t": "number"
                },
                "tasks": {
                  "t": "number"
                }
              }
            },
            "status": {
              "t": "mot",
              "v": "retire"
            }
          }
        }
      },
      {
        "statut": 200,
        "corps": {
          "t": "objet",
          "cles": {
            "ok": {
              "t": "mot",
              "v": true
            },
            "status": {
              "t": "mot",
              "v": "inconnu"
            }
          }
        }
      },
      {
        "statut": 400,
        "corps": {
          "t": "objet",
          "cles": {
            "ok": {
              "t": "mot",
              "v": false
            },
            "reason": {
              "t": "mot",
              "v": "malformed"
            }
          }
        }
      },
      {
        "statut": 401,
        "corps": {
          "t": "objet",
          "cles": {
            "error": {
              "t": "mot",
              "v": "unauthorized"
            }
          }
        }
      },
      {
        "statut": 409,
        "corps": {
          "t": "objet",
          "cles": {
            "ok": {
              "t": "mot",
              "v": false
            },
            "orderIds": {
              "t": "liste",
              "de": [
                {
                  "t": "string"
                }
              ]
            },
            "reason": {
              "t": "mot",
              "v": "colis_en_course"
            }
          }
        }
      }
    ]
  },
  {
    "producteur": "sera",
    "methode": "GET",
    "chemin": "/ops/riders",
    "formes": [
      {
        "statut": 200,
        "corps": {
          "t": "objet",
          "cles": {
            "ok": {
              "t": "mot",
              "v": true
            },
            "riders": {
              "t": "liste",
              "de": [
                {
                  "t": "objet",
                  "cles": {
                    "assignable": {
                      "t": "boolean"
                    },
                    "certified": {
                      "t": "boolean"
                    },
                    "displayName": {
                      "t": "string"
                    },
                    "phoneAlias": {
                      "t": "string"
                    },
                    "privacyAck": {
                      "t": "objet",
                      "cles": {
                        "ackAt": {
                          "t": "string"
                        },
                        "noticeVersion": {
                          "t": "string"
                        }
                      }
                    },
                    "riderId": {
                      "t": "string"
                    },
                    "shift": {
                      "t": "objet",
                      "cles": {
                        "confirmedBy": {
                          "t": "string"
                        },
                        "startedAt": {
                          "t": "string"
                        },
                        "status": {
                          "t": "mot",
                          "v": "on_shift"
                        }
                      }
                    }
                  }
                },
                {
                  "t": "objet",
                  "cles": {
                    "assignable": {
                      "t": "boolean"
                    },
                    "certified": {
                      "t": "boolean"
                    },
                    "displayName": {
                      "t": "string"
                    },
                    "phoneAlias": {
                      "t": "string"
                    },
                    "privacyAck": {
                      "t": "objet",
                      "cles": {
                        "ackAt": {
                          "t": "string"
                        },
                        "noticeVersion": {
                          "t": "string"
                        }
                      }
                    },
                    "riderId": {
                      "t": "string"
                    },
                    "shift": {
                      "t": "objet",
                      "cles": {
                        "status": {
                          "t": "mot",
                          "v": "off_shift"
                        }
                      }
                    }
                  }
                },
                {
                  "t": "objet",
                  "cles": {
                    "assignable": {
                      "t": "boolean"
                    },
                    "certified": {
                      "t": "boolean"
                    },
                    "displayName": {
                      "t": "string"
                    },
                    "phoneAlias": {
                      "t": "string"
                    },
                    "riderId": {
                      "t": "string"
                    },
                    "shift": {
                      "t": "objet",
                      "cles": {
                        "status": {
                          "t": "mot",
                          "v": "off_shift"
                        }
                      }
                    }
                  }
                }
              ]
            }
          }
        }
      },
      {
        "statut": 401,
        "corps": {
          "t": "objet",
          "cles": {
            "error": {
              "t": "mot",
              "v": "unauthorized"
            }
          }
        }
      }
    ]
  },
  {
    "producteur": "sera",
    "methode": "GET",
    "chemin": "/ops/rider-codes",
    "formes": [
      {
        "statut": 200,
        "corps": {
          "t": "objet",
          "cles": {
            "codes": {
              "t": "liste",
              "de": [
                {
                  "t": "objet",
                  "cles": {
                    "mintedAt": {
                      "t": "string"
                    },
                    "revelable": {
                      "t": "boolean"
                    },
                    "riderId": {
                      "t": "string"
                    }
                  }
                }
              ]
            },
            "ok": {
              "t": "mot",
              "v": true
            }
          }
        }
      }
    ]
  },
  {
    "producteur": "sera",
    "methode": "POST",
    "chemin": "/ops/riders/remove",
    "formes": [
      {
        "statut": 200,
        "corps": {
          "t": "objet",
          "cles": {
            "codeRevoked": {
              "t": "boolean"
            },
            "ok": {
              "t": "mot",
              "v": true
            },
            "status": {
              "t": "mot",
              "v": "removed"
            }
          }
        }
      },
      {
        "statut": 401,
        "corps": {
          "t": "objet",
          "cles": {
            "error": {
              "t": "mot",
              "v": "unauthorized"
            }
          }
        }
      },
      {
        "statut": 404,
        "corps": {
          "t": "objet",
          "cles": {
            "ok": {
              "t": "mot",
              "v": false
            },
            "reason": {
              "t": "mot",
              "v": "unknown_rider"
            }
          }
        }
      },
      {
        "statut": 409,
        "corps": {
          "t": "objet",
          "cles": {
            "ok": {
              "t": "mot",
              "v": false
            },
            "reason": {
              "t": "mot",
              "v": "rider_carrying"
            }
          }
        }
      },
      {
        "statut": 428,
        "corps": {
          "t": "objet",
          "cles": {
            "ok": {
              "t": "mot",
              "v": false
            },
            "reason": {
              "t": "mot",
              "v": "custody_bound_not_asserted"
            }
          }
        }
      }
    ]
  }
];
