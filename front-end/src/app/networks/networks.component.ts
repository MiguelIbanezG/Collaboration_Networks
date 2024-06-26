import {
  Component,
  ElementRef,
  OnInit,
  OnDestroy,
  ViewChild,
} from "@angular/core";
import { Network, DataSet, Data, Edge } from "vis";
import { NetworkService } from "../services/network.service";
import { Subject } from "rxjs";
import { NetworkInitService } from "../services/network.init.service";
import { Node } from "../models/network.model";

@Component({
  selector: "app-networks",
  templateUrl: "./networks.component.html",
  styleUrl: "./networks.component.scss",
})
export class NetworksComponent implements OnInit, OnDestroy {
  @ViewChild("menuDiv", { static: true })
  menuDiv!: ElementRef;

  @ViewChild("treeContainer", { static: true })
  treeContainer!: ElementRef;
  nameAuthor: any;
  selectNode: any;
  selectEdge: any;
  prevSelectNode: any;
  isNumber = false;
  publicationsEdge: { [key: string]: string[] } = {};
  publicationsNode: { [key: string]: string[] } = {};

  private data: any = {};
  private nodes: DataSet<Node> = new DataSet<Node>();
  private edges: DataSet<Edge> = new DataSet<Edge>();
  public selectedData: Subject<Data>;
  private network!: Network;

  constructor(
    private NetworkService: NetworkService,
    public NetworkInitService: NetworkInitService
  ) {
    this.selectedData = new Subject<Data>();
  }

  public ngOnInit(): void {
    this.nameAuthor = this.NetworkInitService.selectedAuthors;

    const networkOptions = this.NetworkService.getNetworkOptions();

    this.nodes = this.NetworkInitService.getNodes();
    this.edges = this.NetworkInitService.getEdges();

    this.data = {
      nodes: this.nodes,
      edges: this.edges,
    };

    this.network = new Network(
      this.treeContainer.nativeElement,
      this.data,
      networkOptions
    );

    this.network.on("select", (params) => this.onSelect(params));
    this.network.on("click", (params) => this.onClick(params));
  }

  public ngOnDestroy(): void {
    if (this.network != null) this.network.destroy();
  }

  updateCluster(): void {
    const networkOptions = this.NetworkService.getNetworkOptions();
    networkOptions.height = "800px";

    this.nodes = this.NetworkInitService.getNodes();
    this.edges = this.NetworkInitService.getEdges();
    this.data = {};
    this.data = {
      nodes: this.nodes,
      edges: this.edges,
    };

    this.network = new Network(
      this.treeContainer.nativeElement,
      this.data,
      networkOptions
    );

    this.network.on("select", (params) => this.onSelect(params));
    this.network.on("click", (params) => this.onClick(params));
  }

  private onClick(params: any): void {
    if (params.nodes.length < 1) {
      if (params.edges.length > 0) {
        this.onClickEdge(params);
      }
    }
  }

  private onClickEdge(params: any): void {
    const edgeId = params.edges[0];

    const edge = this.edges.get(edgeId);

    this.publicationsEdge = {};

    this.selectEdge = {
      edge: edge,
      type: "edge",
    };

    const researcherName = this.selectEdge.edge.to;

    this.NetworkInitService.nameAuthors =
      this.NetworkInitService.nameAuthors.map((author: any) => {
        if (author.researcher == researcherName) {
          if (isNaN(Number(author.researcher))) {
            this.isNumber = false;
          } else {
            this.isNumber = true;
          }

          var uniquePublicationsSet = new Set();
          var uniquePublications: any = [];

          author.publications.forEach((publication: any) => {
            uniquePublicationsSet.add(publication);
          });

          uniquePublications = Array.from(uniquePublicationsSet);
          this.publicationsEdge[author.researcher] = uniquePublications;
        }
        return author;
      });

    this.selectNode = null;
  }

  private onSelect(params: any): void {
    if (params.nodes.length == 1) {
      const selectedNodeId = params.nodes[0];
      const connectedEdges = this.network.getConnectedEdges(selectedNodeId);
      const connectedNodes: any[] = [];
      const label: any[] = [];
      this.publicationsNode = {};

      connectedEdges.forEach((edgeId) => {
        const edge = this.edges.get(edgeId);

        if (edge) {
          if (edge.to == params.nodes) {
            connectedNodes.push(edge.from);
            label.push(edge.label);
          } else {
            connectedNodes.push(edge.to);
            label.push(edge.label);
          }

          this.NetworkInitService.nameAuthors =
            this.NetworkInitService.nameAuthors.map((author: any) => {
              if (author.researcher == edge.to) {
                if (
                  isNaN(Number(author.researcher)) ||
                  selectedNodeId == this.NetworkInitService.selectedAuthors[0]
                ) {
                  this.isNumber = false;
                } else {
                  this.isNumber = true;
                }

                var uniquePublicationsSet = new Set();
                var uniquePublications: any = [];

                author.publications.forEach((publication: any) => {
                  uniquePublicationsSet.add(publication);
                });

                uniquePublications = Array.from(uniquePublicationsSet);
                this.publicationsNode[author.researcher] = uniquePublications;
              }
              return author;
            });
        }
      });

      const result = {
        edges: connectedNodes,
        label: label,
        nodes: params.nodes,
        pointer: params.pointer,
        select: this.isNumber,
      };
      if (this.selectNode) {
        this.prevSelectNode = this.selectNode;
      }

      this.selectNode = result;
      this.selectEdge = null;
    }
  }

  esStringNumero(str: any): boolean {
    return !isNaN(Number(str));
  }
}
