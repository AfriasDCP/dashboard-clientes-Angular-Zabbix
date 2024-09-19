import { Injectable } from "@angular/core";
import {
  HttpClient,
  HttpHeaders,
  HttpParams,
  HttpErrorResponse,
} from "@angular/common/http";

import { map, catchError, tap } from "rxjs/operators";
import { Observable, throwError } from "rxjs";

const httpOptions = {
  headers: new HttpHeaders({
    "Content-Type": "application/json",
  }),
};

@Injectable({
  providedIn: "root",
})
export class ZabbixService {

  private apiUrl = "http://10.71.35.117/zabbix/api_jsonrpc.php";
  private authToken: string = '';

  private url = "http://10.71.46.24:8080/clientes/total-tickets?nombreCliente="

  constructor(private http: HttpClient) { }

  async authenticate(): Promise<any> {
    const body = {
      jsonrpc: '2.0',
      method: 'user.login',
      params: {
        username: "GRAFANAUSER",
        password: "53GUR1D4D",
      },
      id: 1
      // auth: null
    };
    return this.http.post<any>(this.apiUrl, body).toPromise();

  }

  async getHostGroups(): Promise<any> {
    const body = {
      jsonrpc: '2.0',
      method: 'hostgroup.get',
      params: {
        output: 'extend'
      },
      id: 1,
      auth: this.authToken,
    };
    return this.http.post<any>(this.apiUrl, body).toPromise();
  }

  async getHostsByGroup(groupId: string, tagValue: string): Promise<any> {
    const body = {
      jsonrpc: '2.0',
      method: 'host.get',
      params: {
        groupids: groupId,
        output: ['hostid'],
        tags: [
          {
              "tag": "Dispositivo",
              "value": tagValue
          }
        ]
      },
      id: 1,
      auth: this.authToken
    };
    return this.http.post<any>(this.apiUrl, body).toPromise();
  }

  async getProblemsByGroup(groupId: string, tagValue: string): Promise<any> {
    const body = {
      jsonrpc: '2.0',
      method: 'problem.get',
      params: {
        groupids: groupId,
        severities: [4, 5], // Filtrar por severidades high (4) y disaster (5)
        tags: [
          {
              "tag": "Dispositivo",
              "value": tagValue
          }
        ]
      },
      id: 1,
      auth: this.authToken
    };
    return this.http.post<any>(this.apiUrl, body).toPromise();
  }

  async getProblemsByHost(hostId: any): Promise<any> {
    const body = {
      jsonrpc: '2.0',
      method: 'problem.get',
      params: {
        hostids: hostId,
        severities: [4, 5], // Filtrar por severidades high (4) y disaster (5)
      },
      id: 1,
      auth: this.authToken
    };
    return this.http.post<any>(this.apiUrl, body).toPromise();
  }

  // Obtener eventos no resueltos

 async getUnresolvedEvents(groupId: string): Promise<any> {
    const body = {
      jsonrpc: '2.0',
      method: 'event.get',
      params: {
        output: 'extend',
        groupids: groupId,
        severities: [4, 5], // Filtrar por severidades high (4) y disaster (5)
        filter: {
          value: 1
        }
      },
      auth: this.authToken,
      id: 1
    };
    return this.http.post<any>(this.apiUrl, body).toPromise();
  }

  async getUnresolvedTriggers(groupId: string, tagValue: string): Promise<any> {
    const body = {
      jsonrpc: '2.0',
      method: 'trigger.get',
      params: {
        output: 'extend',
        groupids: groupId,
        min_severity: 4, // Filtrar por severidades high (4) y disaster (5)
        selectHosts: 'extend',
        filter: {
          value: 1,
          status: 0  // Solo triggers habilitados
        },
        withLastEventUnacknowledged: true
      },
      auth: this.authToken,
      id: 1
    };
    return this.http.post<any>(this.apiUrl, body).toPromise();
  }

  async getEvent(eventId: any): Promise<any> {
    const body = {
      jsonrpc: '2.0',
      method: 'event.get',
      params: {
        output: 'extend',
        eventids: eventId,
        selectHosts: ['hostid'],
      },
      auth: this.authToken,
      id: 1
    };
    return this.http.post<any>(this.apiUrl, body).toPromise();
  }

  async getTicket(cliente: any): Promise<any> {
    return this.http.get<any>(this.url + cliente).toPromise();
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }



}
