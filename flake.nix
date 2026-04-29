{
  description = "Metaboost dev environment (Node 24)";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        buildInputs = with pkgs; [
          nodejs_24
          git
          k3d
          kubectl
          age
          postgresql
        ];
        shellHook = ''
          echo "Metaboost (Node $(node -v))"
          echo "  npm install        # install deps"
          echo "  npm run dev:api    # API"
          echo "  npm run dev:web    # Next.js app"
          echo "  make local_k3d_up  # k3s + ArgoCD (requires host Docker)"
        '';
      in
      {
        devShells.default = pkgs.mkShell {
          inherit buildInputs shellHook;
        };
      }
    );
}
