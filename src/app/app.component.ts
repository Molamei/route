import { Component, OnInit, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Chart } from 'chart.js/auto';

interface Customer {
  id: number;
  name: string;
}

interface Transaction {
  id: number;
  customer_id: number;
  date: string;
  amount: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {
  customers: Customer[] = [];
  transactions: Transaction[] = [];
  filteredCustomers: Customer[] = [];
  filterName: string = '';
  filterAmount: number | null = null;
  selectedCustomerId: number | null = null;
  chart: Chart | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchData();
  }

  ngAfterViewInit() {
    if (this.selectedCustomerId) {
      this.updateGraph();
    }
  }

  fetchData() {
    this.http.get<any>('http://localhost:4000/allData').subscribe(data => {
      this.customers = data.customers;
      this.transactions = data.transactions;
      this.filteredCustomers = this.customers;
    });
  }

  filterCustomers() {
    console.log(`Filtering customers by name: ${this.filterName} and amount: ${this.filterAmount}`);
    this.filteredCustomers = this.customers.filter(customer => {
      const customerTransactions = this.transactions.filter(t => t.customer_id === customer.id);
      const amountFilter = this.filterAmount !== null ? customerTransactions.some(t => t.amount === this.filterAmount) : true;
      const nameFilter = !this.filterName || customer.name.toLowerCase().includes(this.filterName.toLowerCase());
      return nameFilter && amountFilter;
    });
    console.log(`Filtered Customers: ${JSON.stringify(this.filteredCustomers)}`);
  }

  getTransactionsForCustomer(customerId: number): Transaction[] {
    return this.transactions.filter(t => t.customer_id === customerId);
  }

  updateGraph() {
    if (!this.selectedCustomerId) {
      return;
    }

    console.log('Selected Customer ID:', this.selectedCustomerId);
    const filteredTransactions = this.transactions.filter(t => t.customer_id == this.selectedCustomerId);
    const dates = [...new Set(filteredTransactions.map(t => t.date))];
    const amounts = dates.map(date =>
      filteredTransactions.filter(t => t.date === date).reduce((sum, t) => sum + t.amount, 0)
    );

    console.log(`Updating graph for customer ${this.selectedCustomerId} with transactions: ${JSON.stringify(filteredTransactions)}`);
    console.log(`Dates: ${dates}, Amounts: ${amounts}`);

    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = (document.getElementById('transactionChart') as HTMLCanvasElement)?.getContext('2d');
    if (!ctx) {
      console.error('Failed to get canvas context');
      return;
    }

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: dates,
        datasets: [{
          label: 'Total Transaction Amount',
          data: amounts,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });

    console.log('Chart updated successfully');
  }
}
