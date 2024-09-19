// @ts-ignore: Object is possibly 'null'.
import { ChangeDetectorRef, Component } from '@angular/core';
import { ZabbixService } from '../services/zabbix.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { Table } from 'primeng/table';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'dashboardClientes';
  selectedClients = [];
  selectedTopClients = [];
  selectedTopClientsTemp = [];
  showLoader = false;
  arrClientesRight:any = [];
  arrClientesRightTemp:any = [];

  groupData: any = [];
  groupDataTemp: any = [];
  searchValue: string = '';
  txtVacio = 'Selecciona clientes de la lista de la izquierda para ver sus detalles.';

  first = 0;

  rows = 10;

  constructor(
    private ref: ChangeDetectorRef,
    private zabbixService: ZabbixService,
    private modalService: NgbModal,
    private spinner: NgxSpinnerService
  ) {
    this.getDatos();
    this.getTickets('BANAMEX IWAN');
  }

  async getDatos() {
    // this.spinner.show();
    this.showLoader = true;
    try {
      const authResponse = await this.zabbixService.authenticate();
      this.zabbixService.setAuthToken(authResponse.result);
      const groupsResponse = await this.zabbixService.getHostGroups();
      const groups = groupsResponse.result;
      let i = 0;
      for (const group of groups) {

        // CPEs
        const hostsResponse = await this.zabbixService.getHostsByGroup(group.groupid, 'CPE');
        const totalHosts = hostsResponse.result.length;

        const problemsResponse = await this.zabbixService.getProblemsByGroup(group.groupid, 'CPE');
        const problems = problemsResponse.result;

        const eventId = problems.map((problem: any) => problem.eventid);

        // console.log('EventId:', eventId);

        const arrEvent = await this.zabbixService.getEvent(eventId);
        // console.log('Event:', arrEvent);

        // const triggersResponse = await this.zabbixService.getUnresolvedTriggers("4184", 'CPE');
        const hostsWithProblems = new Set(arrEvent.result.map((trigger: any) => trigger.hosts[0].hostid));

        const uniqueHostsWithProblems = hostsWithProblems.size;
        const hostsWithoutProblems = totalHosts - uniqueHostsWithProblems;

        // RadioBases

        const hostsResponseRB = await this.zabbixService.getHostsByGroup(group.groupid, 'Radio-base');
        const totalHostsRB = hostsResponseRB.result.length;

        const problemsResponseRB = await this.zabbixService.getProblemsByGroup(group.groupid, 'Radio-base');
        const problemsRB = problemsResponseRB.result;

        const eventIdRB = problemsRB.map((problem: any) => problem.eventid);

        // console.log('EventId:', eventIdRB);

        const arrEventRB = await this.zabbixService.getEvent(eventIdRB);
        // console.log('Event:', arrEventRB);

        // const triggersResponseRB = await this.zabbixService.getUnresolvedTriggers("501", 'Radio-base');
        const hostsWithProblemsRB = new Set(arrEventRB.result.map((trigger: any) => trigger.hosts[0].hostid));

        const uniqueHostsWithProblemsRB = hostsWithProblemsRB.size;
        const hostsWithoutProblemsRB = totalHostsRB - uniqueHostsWithProblemsRB;

        this.groupDataTemp.push({
          name: group.name,
          totalHosts: totalHosts,
          totalHostsRB: totalHostsRB,
          totalFinal: parseInt(totalHosts) + parseInt(totalHostsRB),
          problems: problems.length,
          problemsRB: problemsRB.length,
          uniqueHostsWithProblems: uniqueHostsWithProblems,
          hostsWithoutProblems: hostsWithoutProblems,
          uniqueHostsWithProblemsRB: uniqueHostsWithProblemsRB,
          hostsWithoutProblemsRB: hostsWithoutProblemsRB,
          selected: 0,
          arribap: (hostsWithoutProblems * 100) / totalHosts,
          abajop: (uniqueHostsWithProblems * 100) / totalHosts,
          arribapRB: (hostsWithoutProblemsRB * 100) / totalHostsRB ? (hostsWithoutProblemsRB * 100) / totalHostsRB : 0,
          abajopRB: (uniqueHostsWithProblemsRB * 100) / totalHostsRB ? (uniqueHostsWithProblemsRB * 100) / totalHostsRB : 0,
        });


        // ordenar por número de problemas únicos de forma descendente
        this.groupData = this.groupDataTemp;
        this.groupDataTemp.sort((a: any, b: any) => b.totalFinal - a.totalFinal || b.selected - a.selected);
        // console.log('Datos de grupo:', this.groupDataTemp);
        // return;
        if (i == groups.length - 1) {
          this.spinner.hide();
          this.showLoader = false;
          this.ref.detectChanges();
        }
        i++;
        this.ref.detectChanges();

      }
    } catch (error) {
      console.error('Error al obtener datos de Zabbix:', error);
    }
  }

  async getTickets(cliente: string) {
    try {
      const ticketResponse = await this.zabbixService.getTicket(cliente);
      return ticketResponse;
    } catch (error) {
      console.error('Error al obtener tickets:', error);
    }
  }

  async onRowSelect(event: any) {
    this.arrClientesRight = this.arrClientesRightTemp;
    this.selectedTopClients = this.selectedTopClientsTemp;
    console.log('Evento:', event);
    let arrTickets = await this.getTickets(event.data.name);
    console.log('Tickets:', arrTickets);
    let cpes = arrTickets.items.find((item: any) => item.clase === 'CPE');

    this.arrClientesRight.push(
      {
        cliente: event.data.name,
        progress: [{
          title: 'CPEs',
          alarmas: (event.data.uniqueHostsWithProblems * 100) / event.data.totalHosts,
          tickets: (event.data.hostsWithoutProblems * 100) / arrTickets.items.find((item: any) => item.clase === 'CPE').total,
          total_alarmas: event.data.uniqueHostsWithProblems,
          total_tickets: arrTickets.items.find((item: any) => item.clase === 'CPE').total,
          total: event.data.totalHosts,
          type: 'success'
        },
        {
          title: 'ONTs',
          alarmas: 0,
          tickets: 0,
          total_alarmas: 0,
          total_tickets: arrTickets.items.find((item: any) => item.clase === 'ONT').total,
          total: '0',
          type: 'danger'
        },
        {
          title: 'Radiobases',
          alarmas: (event.data.uniqueHostsWithProblemsRB * 100) / event.data.totalHostsRB,
          tickets: (event.data.hostsWithoutProblemsRB * 100) / arrTickets.items.find((item: any) => item.clase === 'RADIOBASE').total,
          total_alarmas: event.data.uniqueHostsWithProblemsRB,
          total_tickets: arrTickets.items.find((item: any) => item.clase === 'RADIOBASE').total,
          total: event.data.totalHostsRB,
          type: 'blue'
        }]
      }
    );
    // Ordenar por total
    this.arrClientesRight.sort((a:any, b:any) => b.progress[0].total - a.progress[0].total);
    this.selectedClients.sort((a:any, b:any) => b.totalHosts - a.totalHosts);
    this.selectedTopClients = this.selectedClients;

    // Quitar de groupData el cliente seleccionado
    this.groupData = this.groupData.filter((item: any) => item.name !== event.data.name);
    this.groupDataTemp = this.groupDataTemp.filter((item: any) => item.name !== event.data.name);

    this.arrClientesRightTemp = this.arrClientesRight;
    this.selectedTopClientsTemp = this.selectedTopClients;

    console.log('Clientes seleccionados:', this.arrClientesRight);

    this.ref.detectChanges();

  }

  onRowUnselect(event: any) {
    this.arrClientesRight = this.arrClientesRight.filter((item:any) => item.cliente !== event.data.name);
    this.arrClientesRight.sort((a:any, b:any) => b.progress[0].total - a.progress[0].total);
  }

  filterSelected(){
    console.log('Filter:', this.searchValue);
    this.arrClientesRight = this.arrClientesRightTemp;
    // Filtro lado derecho
    let arr = this.arrClientesRightTemp.filter((item:any) => item.cliente.toLowerCase().includes(this.searchValue.toLowerCase()));
    if (arr.length > 0) {
      this.arrClientesRight = arr;
    } else {
      this.arrClientesRight = [];
      this.txtVacio = 'No se encontraron resultados.';
    }
    // this.arrClientesRight = this.arrClientesRight.filter((item:any) => item.cliente.toLowerCase().includes(this.searchValue.toLowerCase()));

    // Filtro Top
    let top = this.selectedTopClientsTemp.filter((item:any) => item.name.toLowerCase().includes(this.searchValue.toLowerCase()));
    this.selectedTopClients = top;

    this.ref.detectChanges();
  }

  deleteFromTop(event: any) {

    // Eliminar de la lista de clientes seleccionados top
    this.selectedTopClients = this.selectedTopClients.filter((item: any) => item.name !== event.name);
    this.selectedTopClientsTemp = this.selectedTopClients;

    // Eliminar de la lista de clientes seleccionados
    this.selectedClients = this.selectedClients.filter((item: any) => item.name !== event.name);

    // Elliminar de la lista de clientes del lado derecho
    this.arrClientesRight = this.arrClientesRight.filter((item: any) => item.cliente !== event.name);
    this.arrClientesRight.sort((a:any, b:any) => b.progress[0].total - a.progress[0].total);
    this.arrClientesRightTemp = this.arrClientesRight;

    // Agregar de nuevo a la lista de clientes en la tabla
    this.groupDataTemp.push(event);
    this.groupDataTemp.sort((a:any, b:any) => b.totalHosts - a.totalHosts);
    this.ref.detectChanges();
  }

  clear(table: Table) {
    table.clear();
    this.searchValue = ''
    this.arrClientesRight = this.arrClientesRightTemp;
    this.selectedTopClients = this.selectedTopClientsTemp;
    this.txtVacio = 'Selecciona clientes de la lista de la izquierda para ver sus detalles.';
  }

  getPercent(product: any) {
    return (product.totalHost / 100) * product.hostsWithoutProblems
  }

}

